import os
import sys
import subprocess
import re
import time
import atexit
import threading
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
FRONTEND_ENV_FILE = os.path.join(FRONTEND_DIR, ".env")
CLOUDFLARED_EXE = os.path.join(BASE_DIR, "cloudflared", "cloudflared.exe")

LOCAL_URL = "http://127.0.0.1:8000"
VITE_LOCAL_URL = "http://127.0.0.1:5173"
NGROK_FRONTEND_URL = "https://countable-plotless-aubrielle.ngrok-free.dev"

processes = []

def kill_process_tree(pid):
    try:
        subprocess.call(['taskkill', '/F', '/T', '/PID', str(pid)], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def update_env(key, value):
    env_content = []
    if os.path.exists(FRONTEND_ENV_FILE):
        with open(FRONTEND_ENV_FILE, "r", encoding="utf-8") as f:
            env_content = f.readlines()

    updated = False
    for i, line in enumerate(env_content):
        if line.startswith(f"{key}="):
            env_content[i] = f"{key}={value}\n"
            updated = True
            break

    if not updated:
        env_content.append(f"\n{key}={value}\n")

    with open(FRONTEND_ENV_FILE, "w", encoding="utf-8") as f:
        f.writelines(env_content)

def cleanup():
    print("\nSHUTTING DOWN...")
    update_env("VITE_BACKEND_URL", LOCAL_URL)
    update_env("VITE_FRONTEND_URL", f"{VITE_LOCAL_URL}")
    print("Reverted frontend/.env back to localhost.")

    for p in processes:
        kill_process_tree(p.pid)
        
    print("Done!\n")

atexit.register(cleanup)

def consume_stream(stream):
    for _ in stream:
        pass

def wait_for_server(url, name, timeout=30):
    print(f"-> Waiting for {name} to become available at {url}...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            # Add a small User-Agent header because some dev servers block default python urllib requests
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            urllib.request.urlopen(req)
            print(f"{name} is up and running!")
            return True
        except urllib.error.HTTPError:
            # If we get an HTTP error (like 404), the server is still answering!
            print(f"{name} is up and running!")
            return True
        except urllib.error.URLError:
            time.sleep(0.5)
            
    print(f"{name} took too long to start.")
    return False

def main():
    print(r"""
       _               _          
   ___| |__   ___  ___| | ___   _ 
  / __| '_ \ / _ \/ __| |/ / | | |
 | (__| | | |  __/ (__|   <| |_| |
  \___|_| |_|\___|\___|_|\_\\__, |
                            |___/ 
          
    Hệ thống check-in tự động
          """)
    print("\n" + "="*50)
    print("\nStarting Checky selfhost\n\n")

    print(f"* Target Frontend URL: {NGROK_FRONTEND_URL}")

    # 1. START BACKEND
    print("* Starting Backend (Uvicorn)...")
    backend_proc = subprocess.Popen("uvicorn main:app --reload", shell=True, cwd=BACKEND_DIR)
    processes.append(backend_proc)
    
    if not wait_for_server(LOCAL_URL, "Uvicorn"):
        input("\nERROR: Uvicorn failed to start.")
        sys.exit(1)

    # 2. START CLOUDFLARE TUNNEL
    print("* Starting Cloudflare Tunnel...")
    cf_proc = subprocess.Popen(
        f'"{CLOUDFLARED_EXE}" tunnel --url {LOCAL_URL}', 
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=BACKEND_DIR
    )
    processes.append(cf_proc)

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    
    for line in cf_proc.stderr:
        print(f"[Cloudflare] {line.strip()}")
        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            break

    if not tunnel_url:
        print("Failed to find Cloudflare tunnel URL.")
        input("\nERROR: Cloudflare failed.")
        sys.exit(1)

    print(f"\nSUCCESS: Backend is live at: {tunnel_url}\n")
    threading.Thread(target=consume_stream, args=(cf_proc.stderr,), daemon=True).start()

    # 3. UPDATE ENV VARS
    update_env("VITE_BACKEND_URL", tunnel_url)
    update_env("VITE_FRONTEND_URL", NGROK_FRONTEND_URL)
    print(f"Wired Frontend to Tunnel + Ngrok URL ({NGROK_FRONTEND_URL}).")

    # 4. START FRONTEND
    print("* Starting Frontend (Vite)...")
    # Removed the --host flag because Ngrok only needs to hit localhost
    frontend_proc = subprocess.Popen("npm run dev -- --host 127.0.0.1", shell=True, cwd=FRONTEND_DIR)
    processes.append(frontend_proc)

    # Wait for Vite to ACTUALLY be online before starting Ngrok
    if not wait_for_server(VITE_LOCAL_URL, "Vite"):
        input("\nERROR: Vite failed to start.")
        sys.exit(1)

    # 5. START NGROK
    print("* Starting Ngrok Tunnel in a new window...")
    ngrok_cmd = ["ngrok", "http", "--domain=countable-plotless-aubrielle.ngrok-free.dev", "127.0.0.1:5173"]
    
    # CREATE_NEW_CONSOLE forces it to open in a separate CMD window (Windows only)
    ngrok_proc = subprocess.Popen(
        ngrok_cmd, 
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    processes.append(ngrok_proc)

    print("\n" + "="*50)
    print("Started!")
    print(f"Frontend Ngrok URL : {NGROK_FRONTEND_URL}")
    print(f"Backend Tunnel     : {tunnel_url}")
    print("Press Ctrl+C to stop")
    print("="*50 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
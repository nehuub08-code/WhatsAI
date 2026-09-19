import paramiko
import select
import socket
import sys
import threading
import time
import re
import os

TUNNEL_URL_FILE = os.path.join(os.path.dirname(__file__), "tunnel_url.txt")

def reverse_forward_tunnel(remotehost, remoteport, transport):
    while True:
        try:
            chan = transport.accept(1000)
            if chan is None:
                continue
            thr = threading.Thread(target=handler, args=(chan, remotehost, remoteport))
            thr.daemon = True
            thr.start()
        except Exception:
            break

def handler(chan, host, port):
    sock = socket.socket()
    try:
        sock.connect((host, port))
    except Exception:
        chan.close()
        return

    while True:
        r, w, x = select.select([sock, chan], [], [])
        if sock in r:
            data = sock.recv(4096)
            if len(data) == 0:
                break
            chan.send(data)
        if chan in r:
            data = chan.recv(4096)
            if len(data) == 0:
                break
            sock.send(data)
    chan.close()
    sock.close()

def main():
    print("Generating temporary RSA key for Pinggy...", flush=True)
    key = paramiko.RSAKey.generate(2048)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting to a.pinggy.io on port 443...", flush=True)
    client.connect('a.pinggy.io', port=443, username='b', pkey=key, timeout=15)
    print("Connected to Pinggy SSH!", flush=True)

    transport = client.get_transport()
    remote_port = transport.request_port_forward('', 0)
    print(f"Remote forwarding allocated on port: {remote_port}", flush=True)

    thr = threading.Thread(target=reverse_forward_tunnel, args=('127.0.0.1', 8000, transport))
    thr.daemon = True
    thr.start()

    chan = client.invoke_shell()
    url = None
    start = time.time()
    buffer = ""

    while time.time() - start < 15:
        if chan.recv_ready():
            chunk = chan.recv(4096).decode('utf-8', errors='ignore')
            buffer += chunk
            matches = re.findall(r'https://[a-zA-Z0-9-]+\.(?:free\.pinggy\.net|run\.pinggy-free\.link)', buffer)
            if matches:
                url = matches[0]
                break
        time.sleep(0.1)

    if url:
        print("\n" + "="*60, flush=True)
        print(f"LIVE_PUBLIC_HTTPS_URL: {url}", flush=True)
        print(f"WEBHOOK_CALLBACK_URL: {url}/api/webhook", flush=True)
        print("="*60 + "\n", flush=True)
        with open(TUNNEL_URL_FILE, "w") as f:
            f.write(url)
    else:
        print("Could not extract URL from buffer. Buffer excerpt:", buffer[:200], flush=True)
        return

    print("Tunnel is actively listening and forwarding requests to http://127.0.0.1:8000.", flush=True)
    while True:
        time.sleep(1)

if __name__ == '__main__':
    main()

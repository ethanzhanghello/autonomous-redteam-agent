import ipaddress
import os
import socket


ALLOWLIST_CIDR = os.getenv("ALLOWLIST_CIDR", "172.18.0.0/16")


def check_allowlist(ip: str) -> bool:
    network = ipaddress.ip_network(ALLOWLIST_CIDR)
    return ipaddress.ip_address(ip) in network


def http_probe(target_ip: str, port: int = 80, path: str = "/", timeout: float = 3.0, dry_run: bool = True):
    if not check_allowlist(target_ip):
        return {"status": "error", "reason": "target not in allowlist"}
    if dry_run:
        return {"status": "dry-run", "target": target_ip, "port": port, "path": path}
    with socket.create_connection((target_ip, port), timeout=timeout) as sock:
        req = f"GET {path} HTTP/1.1\r\nHost: {target_ip}\r\nConnection: close\r\n\r\n".encode()
        sock.sendall(req)
        data = sock.recv(4096)
    try:
        text = data.decode("utf-8", errors="replace")
    except Exception:
        text = ""
    return {"status": "ok", "raw": text}


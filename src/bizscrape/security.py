"""
URL and host safety helpers for website enrichment (SSRF / crawl boundaries).

DNS rebinding after the initial check is a residual risk; we re-check the
final URL after redirects. Perfect protection would require pinning resolved
IPs for every hop, which is out of scope for the first OSS release.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

# Common cloud metadata / link-local targets.
_BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
        "metadata",
        "kubernetes",
        "kubernetes.default",
        "kubernetes.default.svc",
    }
)


def is_blocked_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """True when an IP must not be contacted by enrichment."""
    return bool(
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
        or (ip.version == 4 and ip in ipaddress.ip_network("169.254.0.0/16"))
        or (ip.version == 6 and ip in ipaddress.ip_network("fc00::/7"))
    )


def hostname_is_literal_blocked(host: str) -> bool:
    host = (host or "").strip().lower().rstrip(".")
    if not host or host in _BLOCKED_HOSTNAMES:
        return True
    if host.endswith(".localhost") or host.endswith(".local") or host.endswith(".internal"):
        return True
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return is_blocked_ip(ip)


def resolve_and_check_host(host: str) -> None:
    """
    Resolve host and raise ValueError if any address is blocked.

    Callers should treat ValueError as a non-retryable enrichment skip.
    """
    host = (host or "").strip().lower().rstrip(".")
    if hostname_is_literal_blocked(host):
        raise ValueError(f"blocked host: {host}")

    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise ValueError(f"cannot resolve host: {host}") from exc

    if not infos:
        raise ValueError(f"cannot resolve host: {host}")

    for info in infos:
        sockaddr = info[4]
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        if is_blocked_ip(ip):
            raise ValueError(f"blocked IP for host {host}: {ip}")


def validate_fetch_url(url: str, *, resolve: bool = True) -> str:
    """
    Ensure *url* is http(s) and does not target private/internal networks.

    Returns the stripped URL on success; raises ValueError otherwise.
    """
    url = (url or "").strip()
    if not url:
        raise ValueError("empty URL")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"unsupported URL scheme: {parsed.scheme!r}")
    host = parsed.hostname
    if not host:
        raise ValueError("URL missing host")
    if parsed.username or parsed.password:
        raise ValueError("URL userinfo not allowed")

    if hostname_is_literal_blocked(host):
        raise ValueError(f"blocked host: {host}")

    if resolve:
        resolve_and_check_host(host)
    return url

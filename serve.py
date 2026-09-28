"""Loopback-only static preview. No backend, account or database."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

if __name__ == '__main__':
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent))
    # Stable origin preserves this demo's localStorage between runs.
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8877), handler)
    except OSError:
        print('Port 8877 is in use. Close the earlier demo window or run a static server on another port.')
        raise SystemExit(1)
    address = 'http://127.0.0.1:8877/'
    print('Jewelry Orders & Tracking Demo')
    print('Open: ' + address)
    print('Keep this window open while using the demo. Press Ctrl+C to stop.')
    webbrowser.open(address)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

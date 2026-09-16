"""Run: python -m bizscrape.api"""

from __future__ import annotations

import uvicorn

from bizscrape.api.settings import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "bizscrape.api.app:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()

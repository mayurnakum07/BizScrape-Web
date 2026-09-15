from bizscrape.config import CSV_COLUMNS
from bizscrape.store import Store


def test_upsert_dedupe_by_phone(tmp_csv):
    store = Store(str(tmp_csv))
    assert (
        store.upsert(
            {
                "name": "Acme Soft",
                "phones": ["+919876543211"],
                "source": "gmaps",
            }
        )
        == "new"
    )
    assert (
        store.upsert(
            {
                "name": "Acme Software",
                "phones": ["+919876543211"],
                "website": "https://acme.example",
                "source": "justdial",
            }
        )
        == "updated"
    )
    assert store.count() == 1
    row = store._rows[0]
    assert "gmaps" in row["sources"] and "justdial" in row["sources"]
    assert row["website"] == "https://acme.example"
    first_seen = row["first_seen"]
    store.upsert({"name": "Acme Soft", "phones": ["+919876543211"], "source": "gmaps"})
    assert store._rows[0]["first_seen"] == first_seen


def test_target_limit_via_count(tmp_csv):
    store = Store(str(tmp_csv))
    for i in range(5):
        store.upsert(
            {
                "name": f"Company Number {i} Alpha",
                "phones": [f"+9198765432{i:02d}"],
                "source": "gmaps",
            }
        )
    assert store.count() == 5


def test_atomic_csv_roundtrip(tmp_csv):
    store = Store(str(tmp_csv))
    store.upsert(
        {
            "name": "Demo Co",
            "emails": ["info@demo.example"],
            "phones": ["+919811122233"],
            "website": "https://demo.example",
            "source": "gmaps",
        }
    )
    written = store.export_csv(str(tmp_csv))
    assert written == 1
    text = tmp_csv.read_text(encoding="utf-8-sig")
    header = text.splitlines()[0]
    assert header.split(",") == CSV_COLUMNS

    store2 = Store(str(tmp_csv))
    assert store2.count() == 1
    assert store2._rows[0]["emails"] == ["info@demo.example"]


def test_merge_unions_emails(tmp_csv):
    store = Store(str(tmp_csv))
    store.upsert(
        {
            "name": "Union Corp Limited",
            "phones": ["+919811100001"],
            "emails": ["a@union.example"],
            "source": "gmaps",
        }
    )
    store.upsert(
        {
            "name": "Union Corp",
            "phones": ["+919811100001"],
            "emails": ["b@union.example"],
            "source": "gmaps",
        }
    )
    assert store.count() == 1
    assert set(store._rows[0]["emails"]) >= {"a@union.example", "b@union.example"}

try:
    # Poduction mode
    from .app.server import Main
except ImportError:
    try:
        # Developpe mode
        from back_end.app.server import Main
    except ImportError as e:
        print("Error importing 'Main':", e)

if __name__ == "__main__":
    Main.main()

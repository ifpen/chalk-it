import json
import os

def load_category_definitions(filename):
    try:
        with open(filename, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error reading category definitions: {e}")
        return {}

def build_and_save_markdown_tables(widgets_filename, category_definitions_filename):
    build_dir = "build"
    os.makedirs(build_dir, exist_ok=True)  # Create the build directory if it doesn't exist

    try:
        with open(widgets_filename, 'r') as file:
            widgets_data = json.load(file)
            widgets = widgets_data
    except Exception as e:
        print(f"Error loading widget data: {e}")
        return

    category_definitions = load_category_definitions(category_definitions_filename)
    if not category_definitions:
        print("Category definitions could not be loaded. Exiting.")
        return

    grouped_widgets = {}
    for widget in widgets:
        key = widget["typeWidget"]
        grouped_widgets.setdefault(key, []).append(widget)
    
    for category, details in category_definitions.items():
        category_name = details["name"]
        category_path = os.path.join(build_dir, category_name)
        try:
            os.makedirs(category_path, exist_ok=True)  # Create each category directory inside the build directory
        except OSError as e:
            print(f"Could not create directory {category_path}: {e}")
            continue

        for type_widget in details["widgets"]:
            if type_widget in grouped_widgets:
                items = grouped_widgets[type_widget]
                markdown_output = f"### {type_widget}\n\n"
                markdown_output += "| Name | Type | Default Value | Description |\n"
                markdown_output += "|------|------|---------------|-------------|\n"
                for item in items:
                    markdown_output += f"| {item['name']} | {item['type']} | {item['defaultValue']} | {item['description']} |\n"
                markdown_output += '\n'

                filename = os.path.join(category_path, f"{type_widget.replace(' ', '_').lower()}.md")
                try:
                    with open(filename, 'w') as file:
                        file.write(markdown_output)
                except Exception as e:
                    print(f"Error writing to file {filename}: {e}")

# Usage
build_and_save_markdown_tables('paramsReference-result.json', 'widgetsEditorToolboxDefinition.json')

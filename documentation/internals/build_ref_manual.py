import json
import os

def load_category_definitions(filename):
    with open(filename, 'r') as file:
        return json.load(file)

def build_and_save_markdown_tables(widgets_filename, category_definitions_filename):
    # Load widget definitions
    with open(widgets_filename, 'r') as file:
        widgets_data = json.load(file)
        widgets = widgets_data
    
    # Load category definitions
    category_definitions = load_category_definitions(category_definitions_filename)

    # Group widgets by typeWidget
    grouped_widgets = {}
    for widget in widgets:
        key = widget["typeWidget"]
        if key not in grouped_widgets:
            grouped_widgets[key] = []
        grouped_widgets[key].append(widget)
    
    # Prepare category directories and generate Markdown files
    for category, details in category_definitions.items():
        category_name = details["name"]
        os.makedirs(category_name, exist_ok=True)  # Ensure the directory exists

        for type_widget in details["widgets"]:
            if type_widget in grouped_widgets:
                items = grouped_widgets[type_widget]
                markdown_output = f"### {type_widget}\n\n"
                markdown_output += "| Name | Type | Default Value | Description |\n"
                markdown_output += "|------|------|---------------|-------------|\n"
                for item in items:
                    markdown_output += f"| {item['name']} | {item['type']} | {item['defaultValue']} | {item['description']} |\n"
                markdown_output += '\n'  # Extra newline for spacing

                # Write to a file in the corresponding category directory
                filename = os.path.join(category_name, f"{type_widget.replace(' ', '_').lower()}.md")
                with open(filename, 'w') as file:
                    file.write(markdown_output)

# Usage
build_and_save_markdown_tables('paramsReference-result.json', 'widgetsEditorToolboxDefinition.json')

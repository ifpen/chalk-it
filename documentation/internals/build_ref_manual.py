import json
import os
import yaml

def load_json_definitions(filename):
    try:
        with open(filename, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error reading " + filename + ": " + e)
        return {}
    
# Function to create the navigation structure for mkdocsref.yml
def create_nav(structure, type_name_widget_map):
    nav = []
    for section, details in structure.items():
        section_nav = {details['name']: []}
        for widget in details['widgets']:
            page_name = type_name_widget_map[widget]
            section_nav[details['name']].append({page_name: f"{details['name']}/{widget}.md"})
        nav.append(section_nav)
    return nav


def create_yml_index(toolbox_def, type_name_widget_map):
    build_dir = "build"
    mkdocs_config = {
        'site_name': 'Widget graphical properties reference manual',
        'nav': create_nav(toolbox_def, type_name_widget_map)
    }
    filename = os.path.join(build_dir," mkdocsref.yml")
    # Write the mkdocsref.yml file
    with open(filename, 'w') as file:
        yaml.dump(mkdocs_config, file, sort_keys=False)    

def build_and_save_markdown_tables(params_ref, category_definitions, name_type_filename):
    build_dir = "build"
    os.makedirs(build_dir, exist_ok=True)  # Create the build directory if it doesn't exist

    grouped_widgets = {}
    
    widgets = params_ref
    
    type_name = name_type_filename
    
    for widget in widgets:
        key = widget["typeWidget"]
        grouped_widgets.setdefault(key, []).append(widget)
    
    for details in category_definitions.items():
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
                markdown_output = f"### {type_name[type_widget]}\n\n"
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


# Load dependent JSON definition files
params_ref = load_json_definitions('paramsReference-result.json')
toolbox_def = load_json_definitions('widgetsEditorToolboxDefinition.json')
type_name_widget_map = load_json_definitions('widgetNames-result.json')

# Create markdown of each widget type
build_and_save_markdown_tables(params_ref, toolbox_def, type_name_widget_map)

# Create the mkdocsref.yml content
create_yml_index(toolbox_def, type_name_widget_map)
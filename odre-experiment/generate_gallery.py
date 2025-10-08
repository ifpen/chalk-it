#!/usr/bin/env python3
"""
Generate a gallery index.html that links to all dataset dashboards.
Reads datasets.csv and creates an index.html file with links to each dataset's index.html.
"""

import os
import sys
import argparse
import pandas as pd
from pathlib import Path

# Ensure UTF-8 encoding to prevent UnicodeEncodeError on Windows
sys.stdout.reconfigure(encoding='utf-8')


def read_datasets_csv(csv_file, encoding='utf-8'):
    """Read datasets.csv and return a DataFrame with dataset information."""
    try:
        df = pd.read_csv(csv_file, delimiter=";", encoding=encoding)
    except UnicodeDecodeError:
        print(f"⚠️ Failed to decode {csv_file} with encoding '{encoding}'. Trying 'latin-1'...")
        df = pd.read_csv(csv_file, delimiter=";", encoding='latin-1')
        print("🔄 Successfully read CSV with 'latin-1' encoding.")
    except Exception as e:
        print(f"❌ Error reading CSV file: {e}")
        return None

    if 'datasetid' not in df.columns:
        print("❌ Error: 'datasetid' column not found in CSV file.")
        return None
    
    return df


def check_dashboard_exists(dataset_id, base_path="."):
    """Check if a dataset has an index.html dashboard."""
    dashboard_path = Path(base_path) / dataset_id / "index.html"
    return dashboard_path.exists()


def get_dataset_title(df, dataset_id):
    """Extract dataset title from the CSV data."""
    row = df[df['datasetid'] == dataset_id]
    if not row.empty and 'default.title' in df.columns:
        title = row['default.title'].iloc[0]
        if pd.notna(title) and title:
            return title
    return dataset_id


def generate_gallery_html(df, base_path=".", output_file="index.html"):
    """Generate the main gallery HTML page."""
    
    # Get all dataset IDs
    dataset_ids = df['datasetid'].dropna().unique()
    
    # Filter datasets that have dashboards
    datasets_with_dashboards = []
    for dataset_id in dataset_ids:
        dataset_id = str(dataset_id).strip()
        if dataset_id and check_dashboard_exists(dataset_id, base_path):
            title = get_dataset_title(df, dataset_id)
            datasets_with_dashboards.append({
                'id': dataset_id,
                'title': title,
                'url': f"{dataset_id}/index.html"
            })
    
    print(f"📊 Found {len(datasets_with_dashboards)} datasets with dashboards")
    
    # Generate HTML content
    html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Gallery - ODRE Open Data</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        header {{
            text-align: center;
            color: white;
            margin-bottom: 40px;
            padding: 30px 20px;
        }}
        
        h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}
        
        .subtitle {{
            font-size: 1.2em;
            opacity: 0.9;
        }}
        
        .stats {{
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 15px;
            margin: 20px auto;
            max-width: 400px;
            color: white;
            text-align: center;
        }}
        
        .gallery {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
            padding: 20px 0;
        }}
        
        .card {{
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
            display: block;
            position: relative;
            overflow: hidden;
        }}
        
        .card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }}
        
        .card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }}
        
        .card:hover::before {{
            transform: scaleX(1);
        }}
        
        .card-title {{
            font-size: 1.2em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.4;
        }}
        
        .card-id {{
            font-size: 0.85em;
            color: #666;
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 5px 10px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 10px;
        }}
        
        .icon {{
            float: right;
            opacity: 0.3;
            font-size: 2em;
            transition: all 0.3s ease;
        }}
        
        .card:hover .icon {{
            opacity: 0.7;
            transform: translateX(5px);
        }}
        
        footer {{
            text-align: center;
            color: white;
            margin-top: 50px;
            padding: 20px;
            opacity: 0.8;
        }}
        
        .search-box {{
            margin: 30px auto;
            max-width: 600px;
            position: relative;
        }}
        
        .search-box input {{
            width: 100%;
            padding: 15px 50px 15px 20px;
            border: none;
            border-radius: 50px;
            font-size: 1em;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }}
        
        .search-box input:focus {{
            outline: none;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }}
        
        .search-icon {{
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.2em;
            color: #999;
        }}
        
        .no-results {{
            text-align: center;
            color: white;
            font-size: 1.2em;
            margin-top: 50px;
            display: none;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Dashboard Gallery</h1>
            <p class="subtitle">ODRE Open Data Visualizations</p>
            <div class="stats">
                <strong>{len(datasets_with_dashboards)}</strong> Interactive Dashboards Available
            </div>
        </header>
        
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search dashboards by title or ID..." />
            <span class="search-icon">🔍</span>
        </div>
        
        <div class="gallery" id="gallery">
"""
    
    # Add cards for each dataset
    for dataset in datasets_with_dashboards:
        html_content += f"""            <a href="{dataset['url']}" class="card" data-title="{dataset['title'].lower()}" data-id="{dataset['id'].lower()}">
                <span class="icon">📈</span>
                <div class="card-title">{dataset['title']}</div>
                <div class="card-id">{dataset['id']}</div>
            </a>
"""
    
    html_content += """        </div>
        
        <div class="no-results" id="noResults">
            No dashboards found matching your search.
        </div>
        
        <footer>
            <p>Generated automatically from ODRE Open Data</p>
            <p>Data source: <a href="https://odre.opendatasoft.com" style="color: white;">odre.opendatasoft.com</a></p>
        </footer>
    </div>
    
    <script>
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const gallery = document.getElementById('gallery');
        const noResults = document.getElementById('noResults');
        const cards = document.querySelectorAll('.card');
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            let visibleCount = 0;
            
            cards.forEach(card => {
                const title = card.getAttribute('data-title');
                const id = card.getAttribute('data-id');
                
                if (title.includes(searchTerm) || id.includes(searchTerm)) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            if (visibleCount === 0) {
                noResults.style.display = 'block';
                gallery.style.display = 'none';
            } else {
                noResults.style.display = 'none';
                gallery.style.display = 'grid';
            }
        });
        
        // Add keyboard shortcut for search (Ctrl/Cmd + K)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    </script>
</body>
</html>
"""
    
    # Write to file
    output_path = Path(base_path) / output_file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"✅ Gallery generated successfully: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error writing gallery file: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Generate a gallery HTML page linking to all dataset dashboards"
    )
    parser.add_argument(
        'csv_file', nargs='?', default='datasets.csv',
        help="CSV file containing dataset information (default: datasets.csv)"
    )
    parser.add_argument(
        '-o', '--output', default='index.html',
        help="Output filename for the gallery (default: index.html)"
    )
    parser.add_argument(
        '-p', '--path', default='.',
        help="Base path where dataset directories are located (default: current directory)"
    )
    parser.add_argument(
        '-e', '--encoding', default='utf-8',
        help="Encoding of the input CSV file (default: utf-8)"
    )
    
    args = parser.parse_args()
    
    print("🚀 Generating dashboard gallery...")
    print(f"📁 Reading datasets from: {args.csv_file}")
    print(f"📂 Base path: {args.path}")
    
    # Read datasets
    df = read_datasets_csv(args.csv_file, args.encoding)
    if df is None:
        sys.exit(1)
    
    print(f"📊 Total datasets in CSV: {len(df)}")
    
    # Generate gallery
    success = generate_gallery_html(df, args.path, args.output)
    
    if success:
        print("✨ Gallery generation complete!")
        sys.exit(0)
    else:
        print("❌ Gallery generation failed")
        sys.exit(1)


if __name__ == "__main__":
    main()

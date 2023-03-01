# How to update the xdash-icons Font?

## Add new icons
1. Open [Icomoon App](https://icomoon.io/app)
2. Import "selection.json" file to the IcoMoon App using the "Import Icons" button
3. Click "Yes" when the message "Would you like to load all the settings stored in your selection file?" displays
4. Import new icons to the existing "xDash-icons" set using the dropdown menu on the right
5. Select/deselect icons as wanted
6. Click "Generate font" at the bottom left
7. Check the new icon names
8. Use the cog icon at the bottom right to update the minor version of the font
9. Download

## Update in project
1. Replace the files in this folder with the newly downloaded ones
2. Open [`style.css`](./style.css) file and [`style/icons/_xdash-icons.scss`](../../../style/icons/_xdash-icons.scss)
3. Copy the newly added rules from the `.css` file to the `.scss`. **/!\\ Be carefull not to remove the `// Basic colored icons` section**
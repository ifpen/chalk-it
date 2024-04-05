# Assets guidelines

The assets arborescence has recently been reviewed to match a flatter organization.

This refactoring action came along with a technical implementation of SCSS, a reduction of the number of fonts and icons used, and a lot of repetitive content deletion.

## Styles

What's new:

- CSS styles are now completely written in SCSS.
  The main files can be found here `front-end/source/assets/style/studio.scss` and here `front-end/source/assets/style/tuntime.scss`. Each one of these files is compiled into CSS files under the same directory (along with a .map file) and are called in the gulp build process via the use of the `code/gulpFiles/JsFiles.json` file.
- The gulp run tasks now include a watcher that detects changes inside all `*.scss` files and triggers a BrowserSync reload.
- All the content used in both files is located in the `front-end/source/assets/style/style.scss`. The `front-end/source/assets/style/_utils.scss` file is used as a cheat sheet and is also included at the end of the two main files. This allows us to call only the needed CSS rules for the Runtime/Studio cases.
- A lot of inline styles (but far from all) were removed either in HTML files or JS files.

Why we did it:

- We tried as much as we can to not rely anymore on CSS frameworks and only picked the useful bits that we needed, like Bootstrap's grid or flat UI widgets.
- Another great deal was to suppress as much duplicates as we could, by isolating the Chalk'it App styles from the Users Projects styles for components like forms and buttons for example.
- Doing so, we now have a `front-end/source/assets/style/components` folder and a `front-end/source/assets/style/widgets` folder, the former being for the Chalk'it App and the latter for the Projects built by the users.

How we did it:

- We reorganized all files related to styles (style files, fonts, icons, images...) directly under the `front-end/source/assets` folder.
- We (tried to) remove all duplicated and unused CSS content.
- We split what's left in a lot of SCSS files, each one having only one role.
- We organized these files inside folders in order to easily identify the purpose of each file:
  - The `utils` folder contains the foundations of all SCSS files (variables, functions and mixins).
  - The `base` folder contains the first CSS rules like the reset file and the general typography rules (we mostly target HTML elements, so it's easy to override inside layouts/components).
  - Because it was quite a big subject on its own, the icons related rules are not included in the base folder, but got their own `icon` folder (read below for more infos).
  - The `theme` contains the Chalk'it app theming color declarations (read below for more details).
  - The `layout` contains the Chalk'it app scructure rules like header, asides, main and footer.
  - The `components` and `widgets` are more precise and target one object at a time. Most of the widgets are Third parties and could (should) be imported as dependencies (leaflets, charts...). There were not much work done on these.
  - All that's left are the 2 main files, the style file and the `_utils.scss` cheat sheet file that contains rules that are not related to any above mentioned categories. It should be kept as small as possible.

How to keep it clean:

- Search for existing rules before adding new ones.
- Always try to use CSS classes instead of inline style. It is easier to modify and override this way.
- If what you are looking for in the SCSS files does not exists yet, create a new file in the right folder or use the most appropriate file and extend it.
- Use existing mixins as much as possible (font-size, font-weight, border-radius, media queries...). You can, of course, add new mixins to suit your needs.
- Try not to add much content inside the `_utils.scss` file and refrain from using `!important`.
- Also try to use `flex` or `grid` rules instead of `float` for positioning elements.

### Chalk'it themes

Chalk'it themes are a new concept introduced with the refactoring of the CSS rules. We detect the user browser settings to show a light or dark theme.
To do so, we use CSS Custom Properties (also known as CSS variables).
We set all the CSS Custom Properties in the `front-end/source/assets/style/themes`.

These themes "only" affect the Chalk'it app by customizing its layout parts like header, asides, main, footer and most of its components like buttons, forms, modals and so on.

The projects themes are an entirely different functionality.

### Pojects/Widgets themes

This is also a new concept we introduced right after the refactoring of the CSS.

We introduced an "About the colors" section inside the "Dashboard aspect" sidebar that allows the user to:

- Chose or reset the background color of the Project.
- Set a color theme for all the new widgets created.

We also implemented the "Reset" functionality for the "Graphical properties" of a widget. It reverts all customized properties to default.

Widgets themes are defined in the `front-end/source/assets/style/widget/widget.scss` file. You can find an SCSS array of themes composed of:

- `hue` value that reflects if the theme is a light or dark one;
- background color;
- text color;
- main color and its variants;
- accent colors for charts.

The SASS theme names must match the HTML/JS data-theme color in `front-end/source/angular/modules/dashboard/_partials/panels/dashboard_aspects.html`

What's next:

- We are working on a confirmation modal that allows the user to reset all colors for all widets when changing the project theme.
- A bug has been addressed when resetting the graphical properties of a widget, as the jsonEditor is not refreshed after the confirmation but only after the save.
- We are working on a way to link these themes to the remaining unaffected widgets like eCharts or generic plotly.

## Fonts

For common texts, we use the OpenSans font.
For titles, we use the Montserrat font.
Both are locally hosted and are declared using CSS Custom Properties inside the `front-end/source/assets/styles/utils/_variables.scss` file.

## Icons

We removed Flat-UI icons and Glyphicons to only use **Fontawesome** as a local dependency.
For custom icons used only in Studio mode:

- We locally host our own icon font created/maintained with Icomoon and we use it just like FontAwesome.
- We use SVG icons as background-images for multi-colored icons.

To update or modify the custom icon font, please refer to: [this Doc](./fonts/xDash-icons/update-xdash-icons.md).

Other Icons are found in `front-end/source/assets/icons` and are used for example for datanodes identification.

## Images

We still use images like the Chalk'it logos or with third parties like Leaflet or Sweet Alert. We cleaned up the unused files and reorganized some folders.

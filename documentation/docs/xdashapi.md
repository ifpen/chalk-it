# Chalk'it APIs

xDashApi provides features for building multi-dashboard applications.

Its main feature is to allow navigation between Chalk'it pages with parameter transfer. When landing at the target page, specified dataNodes of type *Variable* can have their initial values modified, as described below.

xDashApi currently runs with JavaScript-type dataNodes.

## goToPage

In [constrained dashboard mode](../export/export#scaling-methods-for-the-constrained-dashboard), the method:

```JavaScript
chalkit.goToPage(pageNumber)
```

allows to show only the targed page. It is the main method for building multi-page app with custom navigation control.

## viewPage

```JavaScript
chalkit.viewPage(pageUrl, inputVals, bNewTab)
```

Navigates to *pageUrl*, setting the values of the specified dataNodes in inputVals.

- pageUrl : target page URL
- inputVals : an array of structures of type
  ```JSON 
  {"dsName": "dataNodeName", "dsVal" : "dataNodeValue"}
  ```
  dsName should be of type string. dsVal can be of any JavaScript primitive type (number, string, boolean), array or JSON.
- bNewTab : open in new tab when true.

## viewProject

Similar to view page, but applies for projects.

```JavaScript
chalkit.viewProject(projectUrl, inputVals, bNewTab)
```



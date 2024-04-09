// Get all the filter filters and the list items
const filters = document.querySelectorAll('.tp-pills-filter input');
const lists = document.querySelectorAll('ul.tp-filtered');
const listItems = document.querySelectorAll('ul.tp-filtered li');
let activeFilters = [];

// Attach event listeners to the filters
filters.forEach(checkbox => {
  checkbox.addEventListener('change', filterItems);
});

// Complete filtering sequence
function filterItems(){
  handleAll(applyFilters);
  handleEmptyList();
};

// Handle the "All" filter
function handleAll(callback) {
  const newFilters = Array.from(filters)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  // If "all" is checked
  if ( newFilters.includes('all') ) {
      // Go through each filter
      filters.forEach(checkbox => {
        // Check if we are on the "all" filter
        const isFilterAll = checkbox.value === 'all';
        
        if (
          ( !activeFilters.includes('all') && !isFilterAll ) 
          || ( activeFilters.includes('all') && isFilterAll )
        ) {
          // If "all" wasn't checked before and gets checked, then uncheck every other filter    
          // OR If "all" was checked and another filter is checked, uncheck "all"
          checkbox.checked = false;
        }
      });
  } 
  else {
    // If no other checkbox is checked, check the "all" checkbox
    const otherFiltersChecked = newFilters.length > 0;
    document.getElementById('filter-all').checked = !otherFiltersChecked;
  }

  if (callback){
    return callback();
  }
}

// Apply filters (after "All" has been handled)
function applyFilters() {
  // Store active filter in an array
  activeFilters = Array.from(filters)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  // On each filterable list item
  listItems.forEach(item => {
    // Store item keywords in an array
    let itemKeywords = [];
    if ( item.hasAttribute('data-keywords') ){
      itemKeywords = item.getAttribute('data-keywords').split(' ');
    }
    // Hide this item if it doesnt match filtered keywords (and not filtered by "all")
    const shouldBeDisplayed = activeFilters.includes('all') || itemKeywords.some(keyword => activeFilters.includes(keyword));
    item.classList.toggle('is-hidden', !shouldBeDisplayed);
  });
}

function handleEmptyList() {
  lists.forEach(list => {
    const emptyStateClassName = 'emptyState-message';

    // Look for existing empty state messages
    const existingMessages = list.querySelectorAll('.' + emptyStateClassName);
    const hasExistingMessages = existingMessages.length > 0;
    // Mark list as empty if all <li> have the "is-hidden" class, 
    // apart from the messages <li> that could already exist
    let isEmpty = false;
    if ( 
      (!hasExistingMessages && list.querySelectorAll('li.is-hidden').length === list.childElementCount)
      || (hasExistingMessages && list.querySelectorAll('li.is-hidden').length === list.childElementCount - existingMessages.length)
    ){
      isEmpty = true;
    }

    if (isEmpty && !hasExistingMessages){
      // Add message if list is empty after filtering and had no existing message already
      const emptyStateMessage = document.createElement('li');
      emptyStateMessage.className = emptyStateClassName;
      emptyStateMessage.innerHTML = `
        <p>No items match your filter criteria.</p>
      `;
      list.appendChild(emptyStateMessage);
    } else if (!isEmpty && hasExistingMessages){
      // If list is not empty anymore, remove existing message
      existingMessages.forEach(message => {
        list.removeChild(message);
      });
    }
  });  
}

// Initially, call the filterItems function to show items based on the default checked filters
filterItems();
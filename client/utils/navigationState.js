// Navigation state management for the app
let hideNavigationElements = false;

// Function to update navigation visibility state
export const setNavigationVisibility = (isVisible) => {
  hideNavigationElements = !isVisible;
};

// Function to get navigation visibility state
export const shouldHideNavigation = () => {
  return hideNavigationElements;
};

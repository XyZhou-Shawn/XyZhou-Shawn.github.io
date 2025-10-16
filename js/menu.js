(function () {
  "use strict";

  $(function () {
    $(".menu-container").load("menu.html");
  });

  // Category filtering functionality
  document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const publicationItems = document.querySelectorAll('.publication-item');

    // Function to filter publications
    function filterPublications(selectedCategory) {
      publicationItems.forEach(item => {
        const itemCategories = item.getAttribute('data-categories').split(' ');
        if (selectedCategory === 'all' || itemCategories.includes(selectedCategory)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    }

    // Set up click handlers for category buttons
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const selectedCategory = button.getAttribute('data-category');
        filterPublications(selectedCategory);
      });
    });

    // Show only selected publications by default
    filterPublications('selected');
  });
})();
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Function to check input value and update target element visibility
    const checkInputValue = (input, target) => {
      if (input.value) {
        target.style.display = 'block'; // or 'visible' if needed
        // If target has data-required="true", set the input inside to required
        if (target.getAttribute('data-required') === 'true') {
          const innerInput = target.querySelector('input');
          if (innerInput) {
            innerInput.required = true;
          }
        }
      } else {
        target.style.display = 'none'; // Hide if no value
        // Remove required attribute from inner input
        if (target.getAttribute('data-required') === 'true') {
          const innerInput = target.querySelector('input');
          if (innerInput) {
            innerInput.required = false;
          }
        }
      }
    };

    // Get all input fields with a data-input attribute
    const inputFields = document.querySelectorAll('[data-input]');
    inputFields.forEach(inputField => {
      // Get the corresponding target element based on the data-input value
      const targetElement = document.querySelector(`[data-element=${inputField.getAttribute('data-input').replace('check', 'show')}]`);
      
      if (inputField && targetElement) {
        // Initially hide the target element
        targetElement.style.display = 'none';
        
        // Initial check
        checkInputValue(inputField, targetElement);

        // Add event listener for input field changes
        inputField.addEventListener('input', () => checkInputValue(inputField, targetElement));
      }
    });
  });
</script>
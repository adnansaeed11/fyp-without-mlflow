(function () {
    // Function to show the message on the page
    function showMessage(message, color) {
      const messageDiv = document.createElement('div');
      messageDiv.style.color = color;
      messageDiv.style.fontSize = '16px';
      messageDiv.style.fontWeight = 'bold';
      messageDiv.style.position = 'fixed';
      messageDiv.style.top = '10px';
      messageDiv.style.left = '50%';
      messageDiv.style.transform = 'translateX(-50%)';
      messageDiv.style.zIndex = '1000';
      messageDiv.style.padding = '10px';
      messageDiv.style.backgroundColor = 'white';
      messageDiv.style.border = `2px solid ${color}`;
      messageDiv.style.borderRadius = '5px';
      messageDiv.style.textAlign = 'center';
  
      messageDiv.textContent = message;
  
      document.body.appendChild(messageDiv);
  
      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }
  
    // Main logic
    const isYouTube = location.hostname.includes('youtube.com');
    const isVideoPage = location.pathname === '/watch';
  
    if (!isYouTube) {
      showMessage('This will only works on YouTube video', 'red');
    } else if (isYouTube && !isVideoPage) {
      // YouTube but not on a video watch page (like home, subscriptions, etc.)
      showMessage('Please play a video.', 'red');
    } else if (!document.querySelector('video')) {
      // On /watch but still no video tag (very rare, edge case)
      showMessage('Please play a video.', 'red');
    }
  })();
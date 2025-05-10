document.addEventListener('DOMContentLoaded', function () {
    const commentsContainer = document.getElementById('comments-container');
    const loadingText = document.getElementById('loading');
  
    const YOUTUBE_API_KEY = 'AIzaSyB3FfexlaOaqjt3Ud5-1XEj784SlQFGp7Y';
  
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const activeTab = tabs[0];
      const url = activeTab.url;
  
      if (!url.includes("youtube.com/watch?v=")) {
        commentsContainer.innerHTML = "<p><span style='color: red;'>This only works on YouTube video pages.</span></p>";
        return;
      }
  
      try {
        const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
        if (!videoIdMatch) {
          commentsContainer.innerHTML = "<p>Could not extract video ID. Please play a video.</p>";
          return;
        }
  
        const videoId = videoIdMatch[1];
        loadingText.style.display = 'block';
        commentsContainer.innerHTML = '';
  
        const comments = await getYouTubeComments(videoId);
        const sentiments = await analyzeSentiments(comments);
  
        sentiments.forEach((result, index) => {
          const commentDiv = document.createElement('div');
          commentDiv.classList.add('comment');
  
          if (result.sentiment === '1') {
            commentDiv.classList.add('positive');
          } else if (result.sentiment === '0') {
            commentDiv.classList.add('neutral');
          } else if (result.sentiment === '-1') {
            commentDiv.classList.add('negative');
          }
  
          commentDiv.innerHTML = `<strong>Comment:</strong> ${comments[index]}<br><strong>Sentiment:</strong> ${result.sentiment === '1' ? 'Positive' : result.sentiment === '0' ? 'Neutral' : 'Negative'}`;
          commentsContainer.appendChild(commentDiv);
        });
  
        let positiveCount = 0, neutralCount = 0, negativeCount = 0;
  
        sentiments.forEach(item => {
          if (item.sentiment === '1') positiveCount++;
          else if (item.sentiment === '0') neutralCount++;
          else if (item.sentiment === '-1') negativeCount++;
        });
  
        const totalComments = comments.length;
        const uniqueComments = new Set(comments).size;
        const avgLength = Math.round(comments.reduce((sum, c) => sum + c.split(/\s+/).length, 0) / totalComments);
  
        const positivityScore = (
          ((positiveCount + 0.5 * neutralCount) / totalComments) * 10
        ).toFixed(1);
  
        // Update matrix
        document.getElementById('total-comments').textContent = `Total: ${totalComments}`;
        document.getElementById('unique-comments').textContent = `Unique: ${uniqueComments}`;
        document.getElementById('avg-length').textContent = `Avg. Length: ${avgLength}`;
        // document.getElementById('avg-score').textContent = `Positivity Score: ${positivityScore} / 10 \u{1F44D}`;
  
        // Update bars (width is based on % out of 10, so multiply by 10)
        const percentPositive = ((positiveCount / totalComments) * 100).toFixed(1);
        const percentNeutral = ((neutralCount / totalComments) * 100).toFixed(1);
        const percentNegative = ((negativeCount / totalComments) * 100).toFixed(1);
  
        document.getElementById('positive-bar').style.width = `${percentPositive}%`;
        document.getElementById('neutral-bar').style.width = `${percentNeutral}%`;
        document.getElementById('negative-bar').style.width = `${percentNegative}%`;
  
      } catch (error) {
        console.error("Error:", error);
        commentsContainer.innerHTML = '<p>Error fetching or analyzing comments.</p>';
      } finally {
        loadingText.style.display = 'none';
      }
    });
  
    async function getYouTubeComments(videoId) {
      const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}&maxResults=100`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.items) throw new Error("No comments found or API limit reached");
  
      return data.items.map(item => item.snippet.topLevelComment.snippet.textOriginal);
    }
  
    async function analyzeSentiments(comments) {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: comments.map(text => ({ text }))
        })
      });
  
      if (!response.ok) {
        throw new Error('Error analyzing sentiments');
      }
  
      return response.json();
    }
  });
  
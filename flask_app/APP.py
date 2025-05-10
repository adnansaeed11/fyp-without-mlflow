from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Preprocessing function
def preprocess_comment(comment):
    """Apply text preprocessing steps."""
    if not isinstance(comment, str):
        return ""
    try:
        comment = comment.lower().strip()
        comment = re.sub(r'\n', ' ', comment)
        comment = re.sub(r'[^A-Za-z0-9\s!?.,]', '', comment)
        stop_words = set(stopwords.words('english')) - {'not', 'but', 'however', 'no', 'yet'}
        comment = ' '.join(word for word in comment.split() if word not in stop_words)
        lemmatizer = WordNetLemmatizer()
        comment = ' '.join(lemmatizer.lemmatize(word) for word in comment.split())
        return comment
    except:
        return ""

# Load model and vectorizer from local files
try:
    model = joblib.load('./lgbm_model.pkl')  # Change to your actual model file
    vectorizer = joblib.load('./tfidf_vectorizer.pkl')
except Exception as e:
    raise RuntimeError(f"Failed to load model/vectorizer: {e}")

# Prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    if isinstance(data, list):
        comments = data
    elif isinstance(data, dict):
        comments = data.get('comments')
    else:
        return jsonify({"error": "Invalid input format"}), 400

    if not comments or not isinstance(comments, list):
        return jsonify({"error": "Comments must be a non-empty list"}), 400

    extracted_comments = []
    for i, item in enumerate(comments):
        if isinstance(item, str):
            extracted_comments.append(item)
        elif isinstance(item, dict) and 'text' in item and isinstance(item['text'], str):
            extracted_comments.append(item['text'])
        else:
            return jsonify({
                "error": f"Invalid item at index {i}",
                "invalid_item": str(item)
            }), 400

    try:
        preprocessed = [preprocess_comment(c) for c in extracted_comments]
        transformed = vectorizer.transform(preprocessed)
        features = pd.DataFrame(transformed.toarray(), columns=vectorizer.get_feature_names_out())
        predictions = model.predict(features).tolist()
        predictions = [str(p) for p in predictions]

        return jsonify([
            {"comment": original, "sentiment": pred}
            for original, pred in zip(extracted_comments, predictions)
        ])
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

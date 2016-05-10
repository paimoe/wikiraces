import os
import hashlib

from flask import Flask, render_template, request, jsonify
app = Flask(__name__)

@app.route("/", defaults={'path': ''})
@app.route('/<path:path>')
def hello_world(path):
    return render_template('index.html')
    
@app.route('/api/seed/<seed>')
def get_seed(seed):
    return jsonify({'source': {'title': 'Batman'}, 'dest': {'title': 'Tulip'}})
    
def make_seed(source, dest): pass

if __name__ == '__main__':
    app.debug=True
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))
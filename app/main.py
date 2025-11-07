from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
app.secret_key = b"Hello, developers!"

@app.route("/")
def main():
 return render_template("content/create.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)

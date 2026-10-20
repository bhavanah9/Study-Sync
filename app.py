

from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__)


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(".", filename)


@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "message": "StudySync backend is connected!"
    })


@app.route("/api/study-plan", methods=["POST"])
def create_study_plan():
    data = request.get_json(silent=True) or {}
    subjects = data.get("subjects", [])

    if isinstance(subjects, str):
        subjects = [
            s.strip() for s in subjects.splitlines() if s.strip()
        ]

    if not subjects:
        return jsonify({
            "status": "error",
            "message": "Please provide at least one subject."
        }), 400

    plan = []

    for day in range(1, 8):
        subject = subjects[(day - 1) % len(subjects)]

        plan.append({
            "day": day,
            "subject": subject,
            "task": f"Study and revise {subject}"
        })

    return jsonify({
        "status": "success",
        "message": "Your 7-day study plan is ready!",
        "plan": plan
    })


if __name__ == "__main__":
    app.run(debug=True)

import json
import re

def create_id(title):
    """Generates a clean, unique ID from an exercise title."""
    title = title.replace("Dumbbell", "Dumbbell")
    s = title.lower()
    s = re.sub(r'\([^)]*\)', '', s) # Remove (Push A) etc.
    s = re.sub(r'[^a-z0-9\s-]', '', s) # Remove special chars
    s = re.sub(r'\s+', '-', s) # Replace spaces with hyphens
    s = s.strip('-')
    return s

def get_exercise_by_title(library, title_fragment):
    """Finds an exercise ID in the library by a partial title match."""
    for id, exercise in library.items():
        if title_fragment.lower() == exercise['title'].lower():
            return id
    for id, exercise in library.items():
        if title_fragment.lower() in exercise['title'].lower():
            return id
    return None

# --- Main execution ---
try:
    # --- CHANGED LINE ---
    # Now reads from data-original.json, your "master" file
    with open('data-original.json', 'r', encoding='utf-8') as f:
        original_data = json.load(f)
except FileNotFoundError:
    print("Error: 'data-original.json' not found. Make sure you have this file.")
    exit()
except json.JSONDecodeError:
    print("Error: 'data-original.json' is not a valid JSON file.")
    exit()

# 1. Create the Exercise Library
exercise_library = {}
all_ids = set()

for exercise in original_data:
    title = exercise.get('title', 'Unknown Exercise')
    exercise_id = create_id(title)
    
    original_id = exercise_id
    count = 1
    while exercise_id in exercise_library:
        exercise_id = f"{original_id}-{count}"
        count += 1
        
    exercise_library[exercise_id] = exercise
    all_ids.add(exercise_id)

print(f"Created exercise library with {len(exercise_library)} items.")

# 2. Define the Workout Plan Structure
plan_definition = [
    {
        "dayTitle": "Day 1 – Chest & Triceps (Push A)",
        "purpose": "Builds upper-body pressing strength and long-head triceps mass.",
        "exercises": [
            ("Dumbbell Chest Press", "4×8–10"),
            ("Dumbbell Incline Chest Press", "3×8–10"),
            ("Dumbbell Chest Fly", "3×10–12"),
            ("Overhead Tricep Extension", "3×10–12"), 
            ("Dumbbell Tricep Kickback", "2×12–15"), 
            ("Post Work-Out Body Stretch", "15 min")   
        ]
    },
    {
        "dayTitle": "Day 2 – Back & Biceps (Pull A)",
        "purpose": "Strengthens lats, rhomboids, and biceps while improving posture.",
        "exercises": [
            ("Bent Over Dumbbell Rows", "4×8–10"),      
            ("Bent Over Single Arm Dumbbell Row", "3×10 per side"), 
            ("Dumbbell Hammer Curls", "3×10–12"),       
            ("Dumbbell Concentration Curls", "3×10–12"), 
            ("Dumbbell Pullover", "2×12"), 
            ("Post Work-Out Body Stretch", "15 min")
        ]
    },
    {
        "dayTitle": "Day 3 – Shoulders & Arms",
        "purpose": "Builds shoulder roundness and keeps triceps/biceps stimulated between heavy push/pull days.",
        "exercises": [
            ("Dumbbell Shoulder Press", "4×8–10"),
            ("Dumbbell Lateral Raises", "3×12"),        
            ("Dumbbell Front Raises", "3×12"),        
            ("Dumbbell Skull Crushers", "3×10–12"),    
            ("Dumbbell Zottman Curls", "3×10–12")     
        ]
    },
    {
        "dayTitle": "Day 4 – Chest & Triceps (Push B)",
        "purpose": "Reinforces pressing strength and arm endurance.",
        "exercises": [
            ("Dumbbell Floor Press", "4×8"),           
            ("Dumbbell Incline Chest Flys", "3×10–12"),  
            ("Overhead Tricep Extension", "3×10"),      
            ("Dumbbell Tricep Kickback", "2×15"),      
            ("Upright Dumbbell Rows", "2x12")      
        ]
    },
    {
        "dayTitle": "Day 5 – Back & Biceps (Pull B)",
        "purpose": "Posterior-chain balance and arm shape.",
        "exercises": [
            ("Bent Over Dumbbell Rows", "3×8–10"),      
            ("Dumbbell Rear Delt Flys", "3×12"),        
            ("Dumbbell Scapular Rows", "3×12"),    
            ("Dumbbell Hammer Curls", "3×10–12"),       
            ("Dumbbell Concentration Curls", "2×12–15") 
        ]
    },
    {
        "dayTitle": "Day 6 – Shoulders & Chest Finisher",
        "purpose": "Shoulder fullness and secondary chest activation to close the week.",
        "exercises": [
            ("Dumbbell Arnold Press", "4×10"),         
            ("Dumbbell Lateral Raises", "3×12"),        
            ("Dumbbell Shrugs", "3×12–15"),
            ("Dumbbell Chest Press", "3×10"),          
            ("Overhead Tricep Extension", "2×12")     
        ]
    }
]

workout_plan = []
used_ids = set()

# Map plan to library IDs
for i, day in enumerate(plan_definition):
    day_id = f"day{i+1}"
    new_day = {
        "dayId": day_id,
        "dayTitle": day['dayTitle'],
        "purpose": day['purpose'],
        "exercises": []
    }
    
    for title, sets_reps in day['exercises']:
        exercise_id = get_exercise_by_title(exercise_library, title)
        
        if exercise_id:
            new_day['exercises'].append({
                "id": exercise_id,
                "setsAndReps": sets_reps
            })
            used_ids.add(exercise_id)
        else:
            print(f"Warning: Could not find '{title}' for {day_id}")
            placeholder_id = create_id(title)
            new_day['exercises'].append({
                "id": placeholder_id,
                "setsAndReps": sets_reps
            })
            if placeholder_id not in exercise_library:
                exercise_library[placeholder_id] = {
                    "title": title, 
                    "imagePath": "/images/placeholder.png", 
                    "overview": "No details available for this exercise.", 
                    "howTo": ["Please add instructions."], 
                    "trainersTip": "Check your exercise library."
                }

    workout_plan.append(new_day)

print("Workout plan structured.")

# 3. Create "Other Exercises" Day
other_ids = all_ids - used_ids
other_exercises_list = []
for id in sorted(list(other_ids)):
    other_exercises_list.append({
        "id": id,
        "setsAndReps": "Reference"
    })

other_day = {
    "dayId": "other",
    "dayTitle": "Other Exercises",
    "purpose": "A complete library of all other exercises available for reference, substitution, or creating your own workouts.",
    "exercises": other_exercises_list
}
workout_plan.append(other_day)

print(f"Added 'Other Exercises' day with {len(other_exercises_list)} items.")

# 4. Combine and Write New JSON
final_data = {
    "workoutPlan": workout_plan,
    "exerciseLibrary": exercise_library
}

# --- CHANGED LINE ---
# Now writes directly to data.json, the file your app uses.
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, indent=2)

print("\nSuccess! A new 'data.json' file has been created.")
print("You no longer need to rename files.")
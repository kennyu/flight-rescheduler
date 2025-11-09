import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");

  // Test Convex connection
  const students = useQuery(api.students.list);
  const bookings = useQuery(api.bookings.list, { limit: 10 });
  
  // Check if we're connected
  if (students !== undefined && connectionStatus === "disconnected") {
    console.log("[App] ✅ Connected to Convex!");
    console.log("[App] Students data:", students);
    setConnectionStatus("connected");
  }
  
  // Log connection issues
  if (students === undefined) {
    console.log("[App] ⏳ Waiting for Convex connection...");
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🛫 Flight Rescheduler - Testing Dashboard</h1>
        <p>Test Convex backend and weather API integration</p>
        <div className={`connection-status ${connectionStatus}`}>
          <span className={`status-dot ${connectionStatus}`}></span>
          {connectionStatus === "connected" ? "Connected to Convex" : "Connecting..."}
        </div>
      </div>

      <div className="test-sections">
        <StudentTest />
        <InstructorTest />
        <BookingTest />
        <WeatherTest />
      </div>

      <div style={{ marginTop: "30px" }}>
        <ConflictsDisplay />
      </div>

      <div style={{ marginTop: "30px" }}>
        <RescheduleDisplay />
      </div>

      <div style={{ marginTop: "30px" }}>
        <NotificationCenter />
      </div>

      <div style={{ marginTop: "30px" }}>
        <AuditLogDisplay />
      </div>

      <div style={{ marginTop: "30px" }}>
        <DataDisplay students={students} bookings={bookings} />
      </div>
    </div>
  );
}

// Student Test Component
function StudentTest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [trainingLevel, setTrainingLevel] = useState<"student-pilot" | "private-pilot" | "instrument-rated">("student-pilot");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const createStudent = useMutation(api.students.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StudentTest] Form submitted", { name, email, phone, trainingLevel });
    setError("");
    setResult(null);
    
    try {
      console.log("[StudentTest] Calling createStudent mutation...");
      const studentId = await createStudent({ name, email, phone, trainingLevel });
      console.log("[StudentTest] Success! Student created:", studentId);
      setResult({ success: true, studentId });
      setName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      console.error("[StudentTest] Error creating student:", err);
      setError(err.message);
    }
  };

  return (
    <div className="test-section">
      <h2>👨‍🎓 Create Student</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1-555-0100"
            required
          />
        </div>
        <div className="form-group">
          <label>Training Level</label>
          <select value={trainingLevel} onChange={(e) => setTrainingLevel(e.target.value as any)}>
            <option value="student-pilot">Student Pilot</option>
            <option value="private-pilot">Private Pilot</option>
            <option value="instrument-rated">Instrument Rated</option>
          </select>
        </div>
        <button type="submit" className="button">Create Student</button>
      </form>
      {result && <div className="success">✅ Student created! ID: {result.studentId}</div>}
      {error && <div className="error">❌ Error: {error}</div>}
    </div>
  );
}

// Instructor Test Component
function InstructorTest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const createInstructor = useMutation(api.instructors.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[InstructorTest] Form submitted", { name, email, phone });
    setError("");
    setResult(null);
    
    try {
      console.log("[InstructorTest] Calling createInstructor mutation...");
      const instructorId = await createInstructor({ name, email, phone });
      console.log("[InstructorTest] Success! Instructor created:", instructorId);
      setResult({ success: true, instructorId });
      setName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      console.error("[InstructorTest] Error creating instructor:", err);
      setError(err.message);
    }
  };

  return (
    <div className="test-section">
      <h2>👨‍✈️ Create Instructor</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1-555-0200"
            required
          />
        </div>
        <button type="submit" className="button">Create Instructor</button>
      </form>
      {result && <div className="success">✅ Instructor created! ID: {result.instructorId}</div>}
      {error && <div className="error">❌ Error: {error}</div>}
    </div>
  );
}

// Booking Test Component (simplified - requires existing student/instructor)
function BookingTest() {
  const students = useQuery(api.students.list);
  const instructors = useQuery(api.instructors.list);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const createBooking = useMutation(api.bookings.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[BookingTest] Form submitted", { selectedStudent, selectedInstructor });
    setError("");
    setResult(null);
    
    if (!selectedStudent || !selectedInstructor) {
      console.warn("[BookingTest] Missing student or instructor");
      setError("Please select both student and instructor");
      return;
    }

    try {
      // Create booking for tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      console.log("[BookingTest] Creating booking for tomorrow:", tomorrow);
      const bookingId = await createBooking({
        studentId: selectedStudent as any,
        instructorId: selectedInstructor as any,
        scheduledDate: tomorrow.getTime(),
        departureLocation: {
          name: "KJFK - John F. Kennedy International",
          lat: 40.6413,
          lon: -73.7781,
        },
        destinationLocation: {
          name: "KLGA - LaGuardia Airport",
          lat: 40.7769,
          lon: -73.8740,
        },
      });
      console.log("[BookingTest] Success! Booking created:", bookingId);
      setResult({ success: true, bookingId, scheduledDate: tomorrow.toISOString() });
    } catch (err: any) {
      console.error("[BookingTest] Error creating booking:", err);
      setError(err.message);
    }
  };

  return (
    <div className="test-section">
      <h2>📅 Create Booking</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Student</label>
          <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
            <option value="">Select a student...</option>
            {students?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.trainingLevel})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Instructor</label>
          <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)} required>
            <option value="">Select an instructor...</option>
            {instructors?.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Route</label>
          <input type="text" value="KJFK → KLGA (Tomorrow 10 AM)" disabled />
        </div>
        <button type="submit" className="button" disabled={!students?.length || !instructors?.length}>
          Create Booking
        </button>
      </form>
      {!students?.length && <div className="error">⚠️ Create a student first</div>}
      {!instructors?.length && <div className="error">⚠️ Create an instructor first</div>}
      {result && (
        <div className="success">
          ✅ Booking created! ID: {result.bookingId}
          <br />
          Scheduled: {new Date(result.scheduledDate).toLocaleString()}
        </div>
      )}
      {error && <div className="error">❌ Error: {error}</div>}
    </div>
  );
}

// Weather Test Component
function WeatherTest() {
  const [lat, setLat] = useState("40.6413");
  const [lon, setLon] = useState("-73.7781");
  const [locationName, setLocationName] = useState("KJFK - JFK Airport");
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchWeather = useAction(api.weather.fetchWeatherData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[WeatherTest] Form submitted", { lat, lon, locationName });
    setError("");
    setWeather(null);
    setLoading(true);
    
    try {
      console.log("[WeatherTest] Calling fetchWeather action...");
      const result = await fetchWeather({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        locationName,
      });
      console.log("[WeatherTest] Success! Weather data received:", result);
      setWeather(result);
    } catch (err: any) {
      console.error("[WeatherTest] Error fetching weather:", err);
      setError(err.message || "Failed to fetch weather. Make sure OPENWEATHER_API_KEY is set in Convex dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { name: "KJFK - JFK Airport", lat: "40.6413", lon: "-73.7781" },
    { name: "KLGA - LaGuardia", lat: "40.7769", lon: "-73.8740" },
    { name: "KEWR - Newark", lat: "40.6895", lon: "-74.1745" },
  ];

  return (
    <div className="test-section">
      <h2>🌦️ Fetch Weather Data</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Location Presets</label>
          <select onChange={(e) => {
            const preset = presets[parseInt(e.target.value)];
            if (preset) {
              setLocationName(preset.name);
              setLat(preset.lat);
              setLon(preset.lon);
            }
          }}>
            <option value="">Custom...</option>
            {presets.map((p, i) => (
              <option key={i} value={i}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Location Name</label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="JFK Airport"
            required
          />
        </div>
        <div className="form-group">
          <label>Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="40.6413"
            required
          />
        </div>
        <div className="form-group">
          <label>Longitude</label>
          <input
            type="number"
            step="any"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="-73.7781"
            required
          />
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? "Fetching..." : "Fetch Weather"}
        </button>
      </form>
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Contacting OpenWeatherMap API...
        </div>
      )}
      {weather && (
        <div className="results">
          <h3>Weather Data:</h3>
          <div className="data-item">
            <strong>🌡️ Temperature:</strong> {weather.data.temperature.toFixed(1)}°C
          </div>
          <div className="data-item">
            <strong>👁️ Visibility:</strong> {weather.data.visibility.toFixed(1)} miles
          </div>
          <div className="data-item">
            <strong>💨 Wind Speed:</strong> {weather.data.windSpeed.toFixed(1)} knots
          </div>
          {weather.data.ceiling && (
            <div className="data-item">
              <strong>☁️ Ceiling:</strong> {weather.data.ceiling} feet
            </div>
          )}
          <div className="data-item">
            <strong>🌤️ Conditions:</strong> {weather.data.conditions}
          </div>
          <div className="data-item">
            <strong>⚡ Thunderstorms:</strong> {weather.data.hasThunderstorms ? "YES ⚠️" : "No"}
          </div>
          <div className="data-item">
            <strong>❄️ Icing:</strong> {weather.data.hasIcing ? "YES ⚠️" : "No"}
          </div>
        </div>
      )}
      {error && <div className="error">❌ {error}</div>}
    </div>
  );
}

// Reschedule Display Component
function RescheduleDisplay() {
  const reschedules = useQuery(api.reschedule.listPendingReschedules);
  const generateReschedule = useAction(api.reschedule.generateRescheduleOptions);
  const acceptOption = useMutation(api.reschedule.acceptRescheduleOption);
  const rejectOptions = useMutation(api.reschedule.rejectRescheduleOptions);
  const conflicts = useQuery(api.conflicts.listActiveConflicts);

  const [generating, setGenerating] = useState<string>("");

  const handleGenerate = async (bookingId: string, conflictId: string) => {
    console.log("[RescheduleDisplay] Generating reschedule options", { bookingId, conflictId });
    setGenerating(bookingId);
    try {
      console.log("[RescheduleDisplay] Calling generateReschedule action...");
      await generateReschedule({ bookingId: bookingId as any, conflictId: conflictId as any });
      console.log("[RescheduleDisplay] Success! Reschedule options generated");
      setTimeout(() => setGenerating(""), 2000);
    } catch (err: any) {
      console.error("[RescheduleDisplay] Error generating reschedule:", err);
      alert("Error: " + err.message);
      setGenerating("");
    }
  };

  const handleAccept = async (rescheduleId: string, optionIndex: number, optionDate: number) => {
    console.log("[RescheduleDisplay] Accepting option", { rescheduleId, optionIndex });
    
    // Confirm with user
    const confirmed = window.confirm(
      `Confirm reschedule to ${new Date(optionDate).toLocaleString()}?\n\n` +
      `This will update the booking and notify the student and instructor.`
    );
    
    if (!confirmed) {
      console.log("[RescheduleDisplay] User cancelled acceptance");
      return;
    }
    
    try {
      console.log("[RescheduleDisplay] Calling acceptOption mutation...");
      await acceptOption({ rescheduleId: rescheduleId as any, selectedOptionIndex: optionIndex });
      console.log("[RescheduleDisplay] Success! Option accepted");
      
      // Success feedback
      alert(
        `✅ Reschedule Confirmed!\n\n` +
        `New Date: ${new Date(optionDate).toLocaleString()}\n\n` +
        `The booking has been updated and notifications have been sent.`
      );
    } catch (err: any) {
      console.error("[RescheduleDisplay] Error accepting option:", err);
      alert("❌ Error: " + err.message);
    }
  };

  const handleReject = async (rescheduleId: string) => {
    console.log("[RescheduleDisplay] Rejecting all options", { rescheduleId });
    
    // Confirm with user
    const confirmed = window.confirm(
      `Reject all reschedule suggestions?\n\n` +
      `This will mark these options as rejected. You can generate new suggestions later.`
    );
    
    if (!confirmed) {
      console.log("[RescheduleDisplay] User cancelled rejection");
      return;
    }
    
    try {
      console.log("[RescheduleDisplay] Calling rejectOptions mutation...");
      await rejectOptions({ rescheduleId: rescheduleId as any });
      console.log("[RescheduleDisplay] Success! Options rejected");
      
      // Success feedback
      alert(`✅ Suggestions Rejected\n\nYou can generate new reschedule options if needed.`);
    } catch (err: any) {
      console.error("[RescheduleDisplay] Error rejecting options:", err);
      alert("❌ Error: " + err.message);
    }
  };

  if (reschedules === undefined) {
    return (
      <div className="test-section loading">
        <div className="spinner"></div>
        Loading reschedule suggestions...
      </div>
    );
  }

  return (
    <div className="test-section">
      <h2>🤖 AI Reschedule Suggestions</h2>

      {reschedules && reschedules.length > 0 ? (
        <div className="data-list">
          {reschedules.map((r: any) => (
            <div key={r._id} className="data-item">
              <strong>
                {r.student?.name} - {r.booking?.departureLocation.name}
              </strong>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                AI Model: {r.aiModel} | Generated: {new Date(r.generatedAt).toLocaleString()}
              </div>
              <div style={{ marginTop: "8px", padding: "8px", background: "#f8f9fa", borderRadius: "4px" }}>
                <strong>AI Reasoning:</strong>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>{r.aiReasoning}</p>
              </div>
              <div style={{ marginTop: "12px" }}>
                <strong>Suggested Times:</strong>
                {r.suggestedDates.map((opt: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      marginTop: "8px",
                      padding: "12px",
                      background: "#fff",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#667eea" }}>
                      Option {i + 1}: {new Date(opt.date).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      Confidence Score: {opt.score}/100
                    </div>
                    <div style={{ fontSize: "13px", marginTop: "6px" }}>
                      <strong>Reasoning:</strong> {opt.reasoning}
                    </div>
                    {opt.weatherForecast && (
                      <div style={{ fontSize: "12px", marginTop: "4px", color: "#666" }}>
                        <strong>Weather:</strong> {opt.weatherForecast}
                      </div>
                    )}
                    <button
                      onClick={() => handleAccept(r._id, i, opt.date)}
                      style={{
                        marginTop: "8px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Accept This Option
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleReject(r._id)}
                style={{
                  marginTop: "12px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Reject All Options
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "6px" }}>
          <p>No pending reschedule suggestions.</p>
          {conflicts && conflicts.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h3>Generate Suggestions for Conflicts:</h3>
              {conflicts.map((c: any) => (
                <div key={c._id} style={{ marginTop: "8px" }}>
                  <button
                    onClick={() => handleGenerate(c.bookingId, c._id)}
                    disabled={generating === c.bookingId}
                    className="button"
                    style={{ fontSize: "14px", padding: "8px 16px" }}
                  >
                    {generating === c.bookingId ? "Generating..." : `Generate for ${c.student?.name}`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Conflicts Display Component
function ConflictsDisplay() {
  const conflicts = useQuery(api.conflicts.listActiveConflicts);
  const stats = useQuery(api.conflicts.getConflictStats);
  const checkBooking = useMutation(api.conflicts.checkBooking);
  const resolveConflict = useMutation(api.conflicts.resolveConflict);
  
  const [checkingBooking, setCheckingBooking] = useState<string>("");
  const bookings = useQuery(api.bookings.list, { limit: 20 });

  const handleCheckBooking = async (bookingId: string) => {
    console.log("[ConflictsDisplay] Checking booking for conflicts", { bookingId });
    setCheckingBooking(bookingId);
    try {
      console.log("[ConflictsDisplay] Calling checkBooking mutation...");
      await checkBooking({ bookingId: bookingId as any });
      console.log("[ConflictsDisplay] Success! Conflict check scheduled");
      setTimeout(() => setCheckingBooking(""), 1000);
    } catch (err) {
      console.error("[ConflictsDisplay] Error checking booking:", err);
      setCheckingBooking("");
    }
  };

  const handleResolveConflict = async (conflictId: string) => {
    console.log("[ConflictsDisplay] Resolving conflict", { conflictId });
    try {
      console.log("[ConflictsDisplay] Calling resolveConflict mutation...");
      await resolveConflict({ conflictId: conflictId as any, reason: "Manually resolved" });
      console.log("[ConflictsDisplay] Success! Conflict resolved");
    } catch (err: any) {
      console.error("[ConflictsDisplay] Error resolving conflict:", err);
      alert("Error: " + err.message);
    }
  };

  if (conflicts === undefined || stats === undefined) {
    return (
      <div className="test-section loading">
        <div className="spinner"></div>
        Loading conflicts...
      </div>
    );
  }

  return (
    <div className="test-section">
      <h2>⚠️ Weather Conflicts</h2>
      
      {stats && (
        <div className="results" style={{ marginBottom: "20px" }}>
          <h3>Conflict Statistics:</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginTop: "12px" }}>
            <div className="data-item">
              <strong>Total Active:</strong> {stats.active}
            </div>
            <div className="data-item">
              <strong>High Severity:</strong> {stats.bySeverity.high} 🔴
            </div>
            <div className="data-item">
              <strong>Medium:</strong> {stats.bySeverity.medium} 🟡
            </div>
            <div className="data-item">
              <strong>Low:</strong> {stats.bySeverity.low} 🟢
            </div>
          </div>
        </div>
      )}

      {conflicts && conflicts.length > 0 ? (
        <div className="data-list">
          <h3>Active Conflicts:</h3>
          {conflicts.map((c: any) => (
            <div key={c._id} className="data-item" style={{ 
              borderLeft: `4px solid ${c.severity === 'high' ? '#dc3545' : c.severity === 'medium' ? '#ffc107' : '#28a745'}`
            }}>
              <strong>
                {c.student?.name} - {new Date(c.booking?.scheduledDate).toLocaleString()}
              </strong>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                Training Level: {c.studentTrainingLevel} | Severity: {c.severity.toUpperCase()}
              </div>
              <div style={{ marginTop: "8px" }}>
                <strong>Violations:</strong>
                <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                  {c.violatedConditions.map((v: string, i: number) => (
                    <li key={i} style={{ fontSize: "13px" }}>{v}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                <strong>Weather:</strong> {c.weather?.conditions} | 
                Vis: {c.weather?.visibility.toFixed(1)} mi | 
                Wind: {c.weather?.windSpeed.toFixed(1)} kt
                {c.weather?.ceiling && ` | Ceiling: ${c.weather.ceiling} ft`}
              </div>
              <button 
                onClick={() => handleResolveConflict(c._id)}
                style={{ 
                  marginTop: "8px", 
                  padding: "6px 12px", 
                  fontSize: "12px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Resolve Conflict
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="success">✅ No active weather conflicts!</div>
      )}

      {bookings && bookings.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Manual Conflict Check:</h3>
          <div className="form-group">
            <label>Check a booking for conflicts:</label>
            <select 
              onChange={(e) => e.target.value && handleCheckBooking(e.target.value)}
              value=""
              disabled={checkingBooking !== ""}
            >
              <option value="">Select a booking to check...</option>
              {bookings.filter((b: any) => b.status === "scheduled").map((b: any) => (
                <option key={b._id} value={b._id}>
                  {b.student?.name} - {new Date(b.scheduledDate).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          {checkingBooking && <div className="success">✅ Check scheduled! Conflicts will appear above.</div>}
        </div>
      )}
    </div>
  );
}

// Audit Log Display Component
function AuditLogDisplay() {
  const [limit, setLimit] = useState(50);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const auditLogs = useQuery(api.audit.getRecentAuditLogs, { 
    limit,
    entityType: entityFilter === "all" ? undefined : entityFilter as any
  });
  const stats = useQuery(api.audit.getAuditStatistics, {});

  const getEntityBadge = (entityType: string) => {
    const colors: Record<string, string> = {
      booking: "#007bff",
      weather: "#28a745",
      reschedule: "#ffc107",
      notification: "#17a2b8",
    };
    return colors[entityType] || "#6c757d";
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      created: "#28a745",
      updated: "#17a2b8",
      status_updated: "#ffc107",
      deleted: "#dc3545",
      cancelled: "#dc3545",
      rescheduled: "#ffc107",
      accepted: "#28a745",
      rejected: "#dc3545",
      conflict_detected: "#fd7e14",
    };
    return colors[action] || "#6c757d";
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    // If less than 1 hour ago, show relative time
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    
    // If less than 24 hours ago, show hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    // Otherwise show full date
    return date.toLocaleString();
  };

  const filteredLogs = auditLogs
    ? auditLogs.filter((log) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          log.action.toLowerCase().includes(term) ||
          log.entityId.toLowerCase().includes(term) ||
          log.entityType.toLowerCase().includes(term) ||
          (log.actorType && log.actorType.toLowerCase().includes(term))
        );
      })
    : [];

  if (auditLogs === undefined || stats === undefined) {
    return (
      <div className="test-section loading">
        <div className="spinner"></div>
        Loading audit logs...
      </div>
    );
  }

  return (
    <div className="test-section">
      <h2 style={{ marginBottom: "20px" }}>📋 Audit Trail & History</h2>

      {/* Statistics Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "15px", 
        marginBottom: "25px" 
      }}>
        <div style={{
          background: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          border: "1px solid #dee2e6"
        }}>
          <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>
            Total Events (7d)
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#495057" }}>
            {stats.totalLogs}
          </div>
        </div>
        
        {Object.entries(stats.byEntityType).map(([entity, count]) => (
          <div key={entity} style={{
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #dee2e6"
          }}>
            <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>
              {entity.charAt(0).toUpperCase() + entity.slice(1)} Events
            </div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: getEntityBadge(entity) }}>
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        flexWrap: "wrap", 
        marginBottom: "20px",
        alignItems: "center"
      }}>
        <div>
          <label style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px", display: "block" }}>
            Filter by Entity:
          </label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ced4da",
              fontSize: "14px",
            }}
          >
            <option value="all">All</option>
            <option value="booking">Bookings</option>
            <option value="weather">Weather</option>
            <option value="reschedule">Reschedule</option>
            <option value="notification">Notifications</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px", display: "block" }}>
            Search:
          </label>
          <input
            type="text"
            placeholder="Search action, entity ID, or actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ced4da",
              fontSize: "14px",
              width: "100%",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px", display: "block" }}>
            Limit:
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ced4da",
              fontSize: "14px",
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ 
        marginBottom: "15px", 
        fontSize: "14px", 
        color: "#6c757d" 
      }}>
        Showing {filteredLogs.length} of {auditLogs.length} events
      </div>

      {/* Audit Log Entries */}
      <div style={{ 
        maxHeight: "600px", 
        overflowY: "auto",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ 
            padding: "40px", 
            textAlign: "center", 
            color: "#6c757d" 
          }}>
            No audit log entries found
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ 
                background: "#f8f9fa", 
                borderBottom: "2px solid #dee2e6",
                position: "sticky",
                top: 0,
              }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#6c757d", fontWeight: 600 }}>
                  TIME
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#6c757d", fontWeight: 600 }}>
                  ENTITY
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#6c757d", fontWeight: 600 }}>
                  ACTION
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#6c757d", fontWeight: 600 }}>
                  ACTOR
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#6c757d", fontWeight: 600 }}>
                  DETAILS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr 
                  key={log._id}
                  style={{ 
                    borderBottom: "1px solid #dee2e6",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <td style={{ padding: "12px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "white",
                        background: getEntityBadge(log.entityType),
                        display: "inline-block",
                        width: "fit-content",
                      }}>
                        {log.entityType.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "11px", color: "#6c757d", fontFamily: "monospace" }}>
                        {log.entityId.slice(0, 12)}...
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "white",
                      background: getActionBadge(log.action),
                      display: "inline-block",
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px" }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "11px",
                      background: "#e9ecef",
                      color: "#495057",
                    }}>
                      {log.actorType || "unknown"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "#6c757d" }}>
                    {log.details && typeof log.details === "object" ? (
                      <details>
                        <summary style={{ cursor: "pointer", userSelect: "none" }}>
                          View details
                        </summary>
                        <pre style={{ 
                          marginTop: "8px", 
                          padding: "8px", 
                          background: "#f8f9fa", 
                          borderRadius: "4px",
                          fontSize: "11px",
                          maxWidth: "300px",
                          overflow: "auto",
                        }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Enhanced Bookings Dashboard with Filtering and Search
function DataDisplay({ students, bookings }: { students: any; bookings: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"bookings" | "students">("bookings");

  if (students === undefined || bookings === undefined) {
    return (
      <div className="test-section loading">
        <div className="spinner"></div>
        Loading data from Convex...
      </div>
    );
  }

  // Get unique instructors from bookings
  const instructors = [...new Set(bookings?.map((b: any) => b.instructor).filter(Boolean))];

  // Helper: Filter bookings by date
  const filterByDate = (booking: any) => {
    if (dateFilter === "all") return true;
    
    const bookingDate = new Date(booking.scheduledDate);
    const now = new Date();
    const daysDiff = Math.floor((bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (dateFilter) {
      case "today":
        return daysDiff === 0;
      case "week":
        return daysDiff >= 0 && daysDiff <= 7;
      case "month":
        return daysDiff >= 0 && daysDiff <= 30;
      case "past":
        return daysDiff < 0;
      default:
        return true;
    }
  };

  // Filter and search bookings
  const filteredBookings = bookings
    ?.filter((b: any) => {
      // Status filter
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      
      // Date filter
      if (!filterByDate(b)) return false;
      
      // Student filter
      if (studentFilter !== "all" && b.student?._id !== studentFilter) return false;
      
      // Instructor filter
      if (instructorFilter !== "all" && b.instructor?._id !== instructorFilter) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const studentName = b.student?.name?.toLowerCase() || "";
        const instructorName = b.instructor?.name?.toLowerCase() || "";
        const location = b.departureLocation?.name?.toLowerCase() || "";
        const status = b.status?.toLowerCase() || "";
        
        return (
          studentName.includes(query) ||
          instructorName.includes(query) ||
          location.includes(query) ||
          status.includes(query)
        );
      }
      
      return true;
    })
    .sort((a: any, b: any) => b.scheduledDate - a.scheduledDate); // Most recent first

  // Filter students by search
  const filteredStudents = students?.filter((s: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.trainingLevel?.toLowerCase().includes(query)
    );
  });

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      scheduled: { bg: "#10b981", text: "white" },
      "weather-conflict": { bg: "#ef4444", text: "white" },
      rescheduled: { bg: "#f59e0b", text: "white" },
      completed: { bg: "#6b7280", text: "white" },
      cancelled: { bg: "#dc2626", text: "white" },
    };
    
    const style = styles[status] || { bg: "#6b7280", text: "white" };
    
    return (
      <span style={{
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        background: style.bg,
        color: style.text,
        textTransform: "uppercase",
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="test-section">
      <h2>📊 Dashboard</h2>
      
      {/* View Mode Toggle */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setViewMode("bookings")}
          style={{
            padding: "8px 16px",
            background: viewMode === "bookings" ? "#667eea" : "#e5e7eb",
            color: viewMode === "bookings" ? "white" : "#374151",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          📅 Bookings ({filteredBookings?.length || 0})
        </button>
        <button
          onClick={() => setViewMode("students")}
          style={{
            padding: "8px 16px",
            background: viewMode === "students" ? "#667eea" : "#e5e7eb",
            color: viewMode === "students" ? "white" : "#374151",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          👨‍🎓 Students ({filteredStudents?.length || 0})
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder={`🔍 Search ${viewMode === "bookings" ? "bookings (student, instructor, location, status)" : "students (name, email, training level)"}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#667eea"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      {/* Filters (only for bookings view) */}
      {viewMode === "bookings" && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "12px", 
          marginBottom: "20px" 
        }}>
          {/* Status Filter */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="weather-conflict">Weather Conflict</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
              <option value="past">Past Bookings</option>
            </select>
          </div>

          {/* Student Filter */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
              Student
            </label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="all">All Students</option>
              {students?.map((s: any) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Instructor Filter */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
              Instructor
            </label>
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="all">All Instructors</option>
              {instructors?.map((i: any) => (
                <option key={i._id} value={i._id}>{i.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {viewMode === "bookings" && (statusFilter !== "all" || dateFilter !== "all" || studentFilter !== "all" || instructorFilter !== "all" || searchQuery) && (
        <button
          onClick={() => {
            setStatusFilter("all");
            setDateFilter("all");
            setStudentFilter("all");
            setInstructorFilter("all");
            setSearchQuery("");
          }}
          style={{
            marginBottom: "20px",
            padding: "6px 12px",
            fontSize: "13px",
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ✕ Clear All Filters
        </button>
      )}

      {/* Results */}
      <div className="results">
        {viewMode === "bookings" ? (
          <>
            <h3 style={{ marginBottom: "16px" }}>
              Flight Bookings 
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "normal", marginLeft: "8px" }}>
                ({filteredBookings?.length || 0} of {bookings?.length || 0})
              </span>
            </h3>
            {filteredBookings?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredBookings.map((b: any) => (
                  <div 
                    key={b._id} 
                    style={{
                      padding: "16px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "15px", color: "#111827", marginBottom: "4px" }}>
                          {b.student?.name} with {b.instructor?.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>
                          📍 {b.departureLocation?.name}
                        </div>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>
                    
                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      🗓️ {new Date(b.scheduledDate).toLocaleString()}
                    </div>
                    
                    {b.notes && (
                      <div style={{ 
                        marginTop: "8px", 
                        padding: "8px", 
                        background: "#f9fafb", 
                        borderRadius: "4px",
                        fontSize: "13px",
                        color: "#6b7280"
                      }}>
                        💬 {b.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                {searchQuery || statusFilter !== "all" || dateFilter !== "all" || studentFilter !== "all" || instructorFilter !== "all"
                  ? "No bookings match your filters. Try adjusting them!"
                  : "No bookings yet. Create one above!"}
              </p>
            )}
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: "16px" }}>
              Students 
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "normal", marginLeft: "8px" }}>
                ({filteredStudents?.length || 0} of {students?.length || 0})
              </span>
            </h3>
            {filteredStudents?.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {filteredStudents.map((s: any) => (
                  <div 
                    key={s._id}
                    style={{
                      padding: "16px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ fontWeight: "600", fontSize: "15px", color: "#111827", marginBottom: "8px" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                      📧 {s.email}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                      📞 {s.phone}
                    </div>
                    <span style={{
                      display: "inline-block",
                      marginTop: "8px",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: "#dbeafe",
                      color: "#1e40af",
                      textTransform: "capitalize",
                    }}>
                      {s.trainingLevel.replace("-", " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                {searchQuery ? "No students match your search. Try different keywords!" : "No students yet. Create one above!"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Notification Center Component
function NotificationCenter() {
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [recipientType, setRecipientType] = useState<"student" | "instructor">("student");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const students = useQuery(api.students.list);
  const instructors = useQuery(api.instructors.list);
  
  // Get notifications for selected recipient
  const notifications = useQuery(
    api.notifications.getNotifications,
    selectedRecipient 
      ? { 
          recipientId: selectedRecipient as any, 
          recipientType, 
          unreadOnly: showUnreadOnly,
          limit: 20 
        }
      : "skip"
  );
  
  // Get unread count for selected recipient
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    selectedRecipient 
      ? { recipientId: selectedRecipient as any, recipientType }
      : "skip"
  );
  
  // Get all notifications (for testing)
  const allNotifications = useQuery(api.notifications.listAll, { limit: 50 });
  
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const createManualNotification = useMutation(api.notifications.createManualNotification);
  
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  
  const handleMarkAsRead = async (notificationId: string) => {
    console.log("[NotificationCenter] Marking as read:", notificationId);
    try {
      await markAsRead({ notificationId: notificationId as any });
      console.log("[NotificationCenter] Marked as read successfully");
      setResult({ action: "marked-as-read", notificationId });
    } catch (err: any) {
      console.error("[NotificationCenter] Error:", err);
      setError(err.message);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!selectedRecipient) {
      setError("Please select a recipient first");
      return;
    }
    
    console.log("[NotificationCenter] Marking all as read for:", selectedRecipient);
    try {
      const result = await markAllAsRead({ 
        recipientId: selectedRecipient as any, 
        recipientType 
      });
      console.log("[NotificationCenter] Marked all as read:", result);
      setResult(result);
    } catch (err: any) {
      console.error("[NotificationCenter] Error:", err);
      setError(err.message);
    }
  };
  
  const handleDelete = async (notificationId: string) => {
    console.log("[NotificationCenter] Deleting:", notificationId);
    try {
      await deleteNotification({ notificationId: notificationId as any });
      console.log("[NotificationCenter] Deleted successfully");
      setResult({ action: "deleted", notificationId });
    } catch (err: any) {
      console.error("[NotificationCenter] Error:", err);
      setError(err.message);
    }
  };
  
  const handleCreateTestNotification = async () => {
    if (!selectedRecipient) {
      setError("Please select a recipient first");
      return;
    }
    
    console.log("[NotificationCenter] Creating test notification");
    try {
      const testNotifId = await createManualNotification({
        recipientId: selectedRecipient as any,
        recipientType,
        type: "weather-conflict",
        title: "🧪 Test Notification",
        message: "This is a manually created test notification to verify the system works!",
        priority: "medium",
      });
      console.log("[NotificationCenter] Test notification created:", testNotifId);
      setResult({ action: "created", notificationId: testNotifId });
    } catch (err: any) {
      console.error("[NotificationCenter] Error:", err);
      setError(err.message);
    }
  };
  
  // Helper to format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  // Helper to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };
  
  // Helper to get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weather-conflict": return "🚨";
      case "reschedule-suggestion": return "🤖";
      case "booking-confirmed": return "✅";
      case "booking-cancelled": return "❌";
      default: return "📬";
    }
  };
  
  return (
    <div className="test-section">
      <h2>🔔 Notification Center</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
          <select 
            value={recipientType}
            onChange={(e) => {
              setRecipientType(e.target.value as any);
              setSelectedRecipient("");
            }}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
          
          <select 
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", flex: 1, minWidth: "200px" }}
          >
            <option value="">Select {recipientType}...</option>
            {recipientType === "student" 
              ? students?.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))
              : instructors?.map((i: any) => (
                  <option key={i._id} value={i._id}>{i.name} ({i.email})</option>
                ))
            }
          </select>
          
          <label style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px" }}>
            <input 
              type="checkbox" 
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
        </div>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={handleMarkAllAsRead}
            disabled={!selectedRecipient}
            className="btn-primary"
          >
            Mark All Read
          </button>
          <button 
            onClick={handleCreateTestNotification}
            disabled={!selectedRecipient}
            className="btn-secondary"
          >
            Create Test Notification
          </button>
        </div>
      </div>
      
      {/* Unread Count Badge */}
      {selectedRecipient && unreadCount && unreadCount.count > 0 && (
        <div style={{ 
          padding: "10px", 
          background: "#fef3c7", 
          border: "1px solid #fbbf24",
          borderRadius: "4px",
          marginBottom: "15px"
        }}>
          <strong>🔔 {unreadCount.count} unread notification{unreadCount.count !== 1 ? "s" : ""}</strong>
          {unreadCount.highPriority > 0 && (
            <span style={{ marginLeft: "10px", color: "#ef4444" }}>
              ({unreadCount.highPriority} high priority)
            </span>
          )}
        </div>
      )}
      
      {/* Error/Result Display */}
      {error && (
        <div className="error" style={{ marginBottom: "15px" }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "10px" }}>✕</button>
        </div>
      )}
      {result && (
        <div className="success" style={{ marginBottom: "15px" }}>
          Action: {result.action || JSON.stringify(result)}
          <button onClick={() => setResult(null)} style={{ marginLeft: "10px" }}>✕</button>
        </div>
      )}
      
      {/* Notifications List */}
      {selectedRecipient ? (
        <div>
          <h3>Notifications for Selected {recipientType === "student" ? "Student" : "Instructor"}</h3>
          {notifications === undefined ? (
            <p>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p>No notifications {showUnreadOnly ? "(unread)" : ""} found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {notifications.map((notif: any) => (
                <div 
                  key={notif._id}
                  style={{
                    padding: "15px",
                    background: notif.read ? "#f9fafb" : "#fff",
                    border: `2px solid ${notif.read ? "#e5e7eb" : getPriorityColor(notif.priority)}`,
                    borderRadius: "8px",
                    position: "relative"
                  }}
                >
                  {!notif.read && (
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      width: "10px",
                      height: "10px",
                      background: getPriorityColor(notif.priority),
                      borderRadius: "50%"
                    }} />
                  )}
                  
                  <div style={{ display: "flex", alignItems: "start", gap: "10px" }}>
                    <span style={{ fontSize: "24px" }}>{getTypeIcon(notif.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <strong>{notif.title}</strong>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {formatTimeAgo(notif.sentAt)}
                        </span>
                      </div>
                      <p style={{ margin: "5px 0", color: "#374151" }}>{notif.message}</p>
                      
                      {notif.booking && (
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#6b7280",
                          marginTop: "5px",
                          padding: "5px",
                          background: "#f3f4f6",
                          borderRadius: "4px"
                        }}>
                          Booking: {new Date(notif.booking.scheduledDate).toLocaleString()} | 
                          Status: {notif.booking.status}
                        </div>
                      )}
                      
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        {!notif.read && (
                          <button 
                            onClick={() => handleMarkAsRead(notif._id)}
                            style={{ 
                              padding: "5px 10px", 
                              fontSize: "12px",
                              background: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            Mark as Read
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(notif._id)}
                          style={{ 
                            padding: "5px 10px", 
                            fontSize: "12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3>All Notifications (Testing View)</h3>
          {allNotifications === undefined ? (
            <p>Loading all notifications...</p>
          ) : allNotifications.length === 0 ? (
            <p>No notifications in the system yet. Create some test data above!</p>
          ) : (
            <div className="data-list">
              {allNotifications.map((notif: any) => (
                <div key={notif._id} className="data-item">
                  <span>{getTypeIcon(notif.type)}</span>
                  <strong>{notif.title}</strong> - {notif.message.substring(0, 60)}...
                  <span style={{ marginLeft: "10px", fontSize: "12px", color: "#6b7280" }}>
                    ({notif.read ? "read" : "unread"} | {notif.priority} | {formatTimeAgo(notif.sentAt)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;


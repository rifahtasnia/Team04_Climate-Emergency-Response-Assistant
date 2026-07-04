# Flood Emergency Response Dashboard

A Streamlit dashboard that helps emergency coordinators understand current flood alerts, required services, affected populations, volunteer needs, and volunteer availability by location and service type.

## Project Purpose

During a climate emergency or flood event, coordinators need a clear view of:

- How many alerts are active and their severity
- How many people are affected
- Which services (Medical, Food, Evacuation) are required
- How many volunteers are needed vs. available
- Whether each alert is **Covered**, **Partially Covered**, or **Not Covered**

This dashboard reads an Excel file, aggregates alerts and volunteers, matches them by location and service, and presents KPIs, charts, and a filterable response table.

## Dataset Structure

The Excel file should contain **two sheets**:

### 1. Flood Alerts

| Column            | Description                                      |
|-------------------|--------------------------------------------------|
| Alert ID          | Unique alert identifier                          |
| Alert Type        | Type of alert (e.g. Flood)                       |
| Alert Level       | `High`, `Risk`, or `Low`                         |
| Number of People  | People affected by this alert                    |
| Service Needed    | One or more services: `Medical`, `Food`, `Evacuation` (comma-separated if multiple) |
| Volunteers Needed | Number of volunteers required                    |
| Location          | Geographic area of the alert                     |

### 2. Volunteers

| Column        | Description                                      |
|---------------|--------------------------------------------------|
| Volunteer ID  | Unique volunteer identifier                      |
| Name          | Volunteer name                                   |
| Status        | `Available` or `Not Available`                   |
| Location      | Volunteer location                               |
| Service Type  | `Medical`, `Food`, or `Evacuation`               |

> **Note:** A volunteer can appear on multiple rows if they support multiple service types. The bundled `sample_data.xlsx` is derived from the synthetic climate emergency dataset.

## How to Run

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

Or with a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the dashboard

```bash
streamlit run app.py
```

The app opens in your browser (default: http://localhost:8501).

### 3. Load data

- Check **Use bundled sample data** in the sidebar to load `sample_data.xlsx`, or
- Upload your own `.xlsx` file with **Flood Alerts** and **Volunteers** sheets.

## Matching Logic

For each flood alert (split by service when multiple services are listed):

1. Find volunteers where **Status = Available**
2. Match by the same **Location**
3. Match by the required **Service Type**
4. Count matched volunteers and compare to **Volunteers Needed**

**Response status rules:**

| Status              | Condition                                              |
|---------------------|--------------------------------------------------------|
| Covered             | Matched available volunteers ≥ volunteers needed       |
| Partially Covered   | Matched > 0 but less than volunteers needed            |
| Not Covered         | No matched volunteers available                        |

## Alert Priority

Alerts are sorted for the response table as follows:

1. **Alert Level:** High → Risk → Low
2. Within the same level: **Number of People** (descending)
3. Then: **Volunteers Needed** (descending)

## Dashboard Features

- **KPI cards:** Total alerts, counts by level, affected people, volunteers needed, available volunteers
- **Alert charts:** By level, location, affected people, volunteers needed, services
- **Volunteer charts:** Available by location, service type, and location + service
- **High priority alerts:** Top High-level alert rows
- **Response table:** Full matching results with filters for level, location, service, and status
- **Color coding:** High/Not Covered (red), Risk/Partially Covered (orange), Low/Covered (green)

## Project Files

| File               | Purpose                                      |
|--------------------|----------------------------------------------|
| `app.py`           | Streamlit dashboard application              |
| `requirements.txt` | Python dependencies                        |
| `sample_data.xlsx` | Sample Excel file for testing                |
| `README.md`        | Project documentation                        |

## Technology Stack

- Python
- Streamlit
- Pandas
- Plotly
- OpenPyXL

## Team

Climate Emergency Response Assistant — Team 04

"""
Flood Emergency Response Dashboard
===================================
Streamlit app for emergency coordinators to monitor flood alerts,
volunteer availability, and response coverage.
"""


import pandas as pd
import plotly.express as px
import streamlit as st
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALERT_REQUIRED_COLUMNS = [
    "Alert ID",
    "Alert Type",
    "Alert Level",
    "Number of People",
    "Service Needed",
    "Volunteers Needed",
    "Location",
]

VOLUNTEER_REQUIRED_COLUMNS = [
    "Volunteer ID",
    "Name",
    "Status",
    "Location",
    "Service Type",
]

VALID_ALERT_LEVELS = ["High", "Risk", "Low"]
VALID_SERVICES = ["Medical", "Food", "Evacuation"]
VALID_STATUSES = ["Available", "Not Available"]
VALID_RESPONSE_STATUSES = ["Covered", "Partially Covered", "Not Covered"]

ALERT_LEVEL_ORDER = {"High": 0, "Risk": 1, "Low": 2}

# Color palette for emergency dashboard
COLORS = {
    "High": "#DC3545",
    "Risk": "#FD7E14",
    "Low": "#28A745",
    "Covered": "#28A745",
    "Partially Covered": "#FD7E14",
    "Not Covered": "#DC3545",
    "Medical": "#0D6EFD",
    "Food": "#6F42C1",
    "Evacuation": "#20C997",
}

SAMPLE_DATA_PATH = Path(__file__).parent / "sample_data.xlsx"

# Sheet name aliases (case-insensitive partial match)
ALERT_SHEET_KEYWORDS = ("flood", "alert")
VOLUNTEER_SHEET_KEYWORDS = ("volunteer",)


# ---------------------------------------------------------------------------
# Data loading and cleaning helpers
# ---------------------------------------------------------------------------


def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize column names: trim spaces, replace underscores, title-case."""
    renamed = {}
    for col in df.columns:
        clean = str(col).strip().replace("_", " ")
        # Preserve common acronyms / IDs
        clean = clean.replace(" Id", " ID")
        renamed[col] = clean
    return df.rename(columns=renamed)


def find_sheet_name(sheet_names: list[str], keywords: tuple[str, ...]) -> str | None:
    """Return the first sheet whose name contains any keyword (case-insensitive)."""
    for name in sheet_names:
        lower = name.lower()
        if any(kw in lower for kw in keywords):
            return name
    return None


def validate_columns(df: pd.DataFrame, required: list[str], dataset_label: str) -> list[str]:
    """Return a list of missing required column names."""
    missing = [col for col in required if col not in df.columns]
    return missing


def build_service_needed_from_flags(row: pd.Series) -> str:
    """Convert Medical/Food/Evacuation flag columns into a comma-separated string."""
    services = []
    for service in VALID_SERVICES:
        flag_col = f"{service} Needed"
        alt_col = f"{service} Service"
        if flag_col in row.index and pd.notna(row[flag_col]) and int(row[flag_col]) == 1:
            services.append(service)
        elif alt_col in row.index and pd.notna(row[alt_col]) and int(row[alt_col]) == 1:
            services.append(service)
    return ", ".join(services)


def normalize_alerts_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize flood alerts to the standard column layout.
    Supports both the spec format and the wide flag format from synthetic datasets.
    """
    df = clean_column_names(df.copy())

    # Wide format: Medical Needed / Food Needed / Evacuation Needed flags
    flag_cols = [f"{s} Needed" for s in VALID_SERVICES]
    if all(col in df.columns for col in flag_cols) and "Service Needed" not in df.columns:
        df["Service Needed"] = df.apply(build_service_needed_from_flags, axis=1)

    # Column renames from alternate naming conventions
    rename_map = {
        "Number Of Needed Volunteers": "Volunteers Needed",
        "Number of Needed Volunteers": "Volunteers Needed",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    return df


def normalize_volunteers_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize volunteers to the standard column layout.
    Supports one-row-per-volunteer (Service Type column) and wide service flags.
    """
    df = clean_column_names(df.copy())

    flag_cols = [f"{s} Service" for s in VALID_SERVICES]
    if all(col in df.columns for col in flag_cols) and "Service Type" not in df.columns:
        # Melt wide service flags into long format (one row per volunteer + service)
        records = []
        for _, row in df.iterrows():
            for service in VALID_SERVICES:
                if int(row.get(f"{service} Service", 0) or 0) == 1:
                    records.append(
                        {
                            "Volunteer ID": row.get("Volunteer ID"),
                            "Name": row.get("Name", row.get("Volunteer ID")),
                            "Status": row.get("Status"),
                            "Location": row.get("Location"),
                            "Service Type": service,
                        }
                    )
        df = pd.DataFrame(records)

    # Fill missing names with Volunteer ID
    if "Name" not in df.columns:
        df["Name"] = df["Volunteer ID"]
    else:
        df["Name"] = df["Name"].fillna(df["Volunteer ID"])

    return df


def load_excel_data(source) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load Flood Alerts and Volunteers sheets from an Excel file or buffer."""
    xl = pd.ExcelFile(source)
    sheet_names = xl.sheet_names

    alert_sheet = find_sheet_name(sheet_names, ALERT_SHEET_KEYWORDS)
    volunteer_sheet = find_sheet_name(sheet_names, VOLUNTEER_SHEET_KEYWORDS)

    if alert_sheet is None:
        raise ValueError(
            "Could not find a Flood Alerts sheet. "
            f"Available sheets: {', '.join(sheet_names)}"
        )
    if volunteer_sheet is None:
        raise ValueError(
            "Could not find a Volunteers sheet. "
            f"Available sheets: {', '.join(sheet_names)}"
        )

    alerts_raw = pd.read_excel(source, sheet_name=alert_sheet)
    volunteers_raw = pd.read_excel(source, sheet_name=volunteer_sheet)

    return normalize_alerts_df(alerts_raw), normalize_volunteers_df(volunteers_raw)


def coerce_numeric_columns(alerts: pd.DataFrame, volunteers: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Convert numeric fields and strip text fields."""
    alerts = alerts.copy()
    volunteers = volunteers.copy()

    for col in ["Number of People", "Volunteers Needed"]:
        if col in alerts.columns:
            alerts[col] = pd.to_numeric(alerts[col], errors="coerce").fillna(0).astype(int)

    for col in ["Alert Level", "Location", "Service Needed", "Alert Type", "Alert ID"]:
        if col in alerts.columns:
            alerts[col] = alerts[col].astype(str).str.strip()
            alerts[col] = alerts[col].replace({"nan": "", "None": ""})

    for col in ["Status", "Location", "Service Type", "Volunteer ID", "Name"]:
        if col in volunteers.columns:
            volunteers[col] = volunteers[col].astype(str).str.strip()
            volunteers[col] = volunteers[col].replace({"nan": "", "None": ""})

    return alerts, volunteers


def explode_alert_services(alerts: pd.DataFrame) -> pd.DataFrame:
    """
    Split multi-service alerts into one row per service.
    Example: 'Medical, Food' -> two rows.
    """
    df = alerts.copy()
    df["Service Needed"] = df["Service Needed"].astype(str).str.split(",")
    df = df.explode("Service Needed")
    df["Service Needed"] = df["Service Needed"].str.strip()
    df = df[df["Service Needed"].isin(VALID_SERVICES)].copy()
    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Matching and response status
# ---------------------------------------------------------------------------


def get_matched_volunteers(location: str, service: str, volunteers: pd.DataFrame) -> pd.DataFrame:
    """Return available volunteers matching location and service type."""
    mask = (
        (volunteers["Status"] == "Available")
        & (volunteers["Location"] == location)
        & (volunteers["Service Type"] == service)
    )
    matched = volunteers.loc[mask, ["Volunteer ID", "Name"]].drop_duplicates()
    return matched.reset_index(drop=True)


def count_matched_volunteers(location: str, service: str, volunteers: pd.DataFrame) -> int:
    """Count available volunteers matching location and service type."""
    return len(get_matched_volunteers(location, service, volunteers))


def compute_response_status(matched: int, needed: int) -> str:
    """Determine coverage status based on matched vs needed volunteers."""
    if matched >= needed:
        return "Covered"
    if matched > 0:
        return "Partially Covered"
    return "Not Covered"


def build_response_table(alerts: pd.DataFrame, volunteers: pd.DataFrame) -> pd.DataFrame:
    """
    Build the response matching table with one row per alert + service.
    Applies priority sorting: High > Risk > Low, then people and volunteers desc.
    """
    exploded = explode_alert_services(alerts)
    rows = []

    for _, alert in exploded.iterrows():
        matched = count_matched_volunteers(
            alert["Location"], alert["Service Needed"], volunteers
        )
        needed = int(alert["Volunteers Needed"])
        status = compute_response_status(matched, needed)
        missing = max(0, needed - matched)

        rows.append(
            {
                "Alert ID": alert["Alert ID"],
                "Alert Type": alert["Alert Type"],
                "Alert Level": alert["Alert Level"],
                "Location": alert["Location"],
                "Service Needed": alert["Service Needed"],
                "Number of People": alert["Number of People"],
                "Volunteers Needed": needed,
                "Matched Available Volunteers": matched,
                "Missing Volunteers": missing,
                "Response Status": status,
            }
        )

    response_df = pd.DataFrame(rows)

    if response_df.empty:
        return response_df

    response_df["_priority"] = response_df["Alert Level"].map(ALERT_LEVEL_ORDER).fillna(99)
    response_df = response_df.sort_values(
        by=["_priority", "Number of People", "Volunteers Needed"],
        ascending=[True, False, False],
    ).drop(columns=["_priority"])

    return response_df.reset_index(drop=True)


def build_connection_table(alerts: pd.DataFrame, volunteers: pd.DataFrame) -> pd.DataFrame:
    """
    Build a table linking each request to matched volunteer IDs and names by service.
    One row per alert + service with comma-separated volunteer lists.
    """
    exploded = explode_alert_services(alerts)
    rows = []

    for _, alert in exploded.iterrows():
        matched = get_matched_volunteers(
            alert["Location"], alert["Service Needed"], volunteers
        )
        needed = int(alert["Volunteers Needed"])
        matched_count = len(matched)
        status = compute_response_status(matched_count, needed)

        rows.append(
            {
                "Alert ID": alert["Alert ID"],
                "Alert Type": alert["Alert Type"],
                "Alert Level": alert["Alert Level"],
                "Location": alert["Location"],
                "Service Needed": alert["Service Needed"],
                "Number of People": alert["Number of People"],
                "Volunteers Needed": needed,
                "Matched Volunteer IDs": ", ".join(matched["Volunteer ID"].tolist()) or "—",
                "Matched Volunteer Names": ", ".join(matched["Name"].tolist()) or "—",
                "Matched Count": matched_count,
                "Missing Volunteers": max(0, needed - matched_count),
                "Response Status": status,
            }
        )

    connection_df = pd.DataFrame(rows)
    if connection_df.empty:
        return connection_df

    connection_df["_priority"] = connection_df["Alert Level"].map(ALERT_LEVEL_ORDER).fillna(99)
    connection_df = connection_df.sort_values(
        by=["_priority", "Number of People", "Volunteers Needed"],
        ascending=[True, False, False],
    ).drop(columns=["_priority"])

    return connection_df.reset_index(drop=True)


def sort_alerts_by_priority(alerts: pd.DataFrame) -> pd.DataFrame:
    """Sort alert requests: High > Risk > Low, then people and volunteers desc."""
    df = alerts.copy()
    df["_priority"] = df["Alert Level"].map(ALERT_LEVEL_ORDER).fillna(99)
    df = df.sort_values(
        by=["_priority", "Number of People", "Volunteers Needed"],
        ascending=[True, False, False],
    ).drop(columns=["_priority"])
    return df.reset_index(drop=True)


def build_volunteer_list(volunteers: pd.DataFrame) -> pd.DataFrame:
    """Combine volunteer rows into one row per person with all service types."""
    summary = (
        volunteers.groupby(["Volunteer ID", "Name", "Status", "Location"], as_index=False)
        .agg({"Service Type": lambda s: ", ".join(sorted(s.unique()))})
        .rename(columns={"Service Type": "Service Types"})
    )
    return summary.sort_values(["Status", "Location", "Volunteer ID"]).reset_index(drop=True)


# ---------------------------------------------------------------------------
# KPI helpers
# ---------------------------------------------------------------------------


def compute_kpis(alerts: pd.DataFrame, volunteers: pd.DataFrame) -> dict:
    """Calculate summary KPI values for the dashboard header cards."""
    available = volunteers[volunteers["Status"] == "Available"]

    return {
        "total_alerts": alerts["Alert ID"].nunique(),
        "high_alerts": (alerts["Alert Level"] == "High").sum(),
        "risk_alerts": (alerts["Alert Level"] == "Risk").sum(),
        "low_alerts": (alerts["Alert Level"] == "Low").sum(),
        "total_people": int(alerts["Number of People"].sum()),
        "total_volunteers_needed": int(alerts["Volunteers Needed"].sum()),
        "total_available_volunteers": len(available),
        "not_available_volunteers": len(volunteers[volunteers["Status"] == "Not Available"]),
    }


# ---------------------------------------------------------------------------
# Chart builders
# ---------------------------------------------------------------------------


def bar_chart(df: pd.DataFrame, x: str, y: str, title: str, color_map: dict | None = None):
    """Create a simple Plotly bar chart."""
    fig = px.bar(df, x=x, y=y, title=title, color=x, color_discrete_map=color_map or COLORS)
    fig.update_layout(showlegend=False, margin=dict(t=40, b=20, l=20, r=20))
    return fig


def apply_filters(
    response_df: pd.DataFrame,
    alert_levels: list[str],
    locations: list[str],
    services: list[str],
    response_statuses: list[str],
) -> pd.DataFrame:
    """Filter the response table based on sidebar selections."""
    filtered = response_df.copy()
    if alert_levels:
        filtered = filtered[filtered["Alert Level"].isin(alert_levels)]
    if locations:
        filtered = filtered[filtered["Location"].isin(locations)]
    if services:
        filtered = filtered[filtered["Service Needed"].isin(services)]
    if response_statuses:
        filtered = filtered[filtered["Response Status"].isin(response_statuses)]
    return filtered


# ---------------------------------------------------------------------------
# Streamlit UI
# ---------------------------------------------------------------------------


def inject_custom_css():
    """Apply emergency-dashboard styling."""
    st.markdown(
        """
        <style>
        .main-header {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 0.25rem;
        }
        .sub-header {
            color: #555;
            margin-bottom: 1.5rem;
        }
        div[data-testid="stMetric"] {
            background: #f8f9fa;
            border-left: 4px solid #0D6EFD;
            padding: 0.75rem;
            border-radius: 6px;
        }
        .priority-high { color: #DC3545; font-weight: bold; }
        .priority-risk { color: #FD7E14; font-weight: bold; }
        .priority-low { color: #28A745; font-weight: bold; }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_kpi_row(kpis: dict):
    """Display the seven KPI summary cards."""
    c1, c2, c3, c4, c5, c6, c7 = st.columns(7)
    c1.metric("Total Alerts", kpis["total_alerts"])
    c2.metric("High Alerts", kpis["high_alerts"])
    c3.metric("Risk Alerts", kpis["risk_alerts"])
    c4.metric("Low Alerts", kpis["low_alerts"])
    c5.metric("Affected People", kpis["total_people"])
    c6.metric("Volunteers Needed", kpis["total_volunteers_needed"])
    c7.metric("Available Volunteers", kpis["total_available_volunteers"])


def render_alert_charts(alerts: pd.DataFrame, response_df: pd.DataFrame):
    """Charts for alert aggregation."""
    st.subheader("Alert Analysis")

    col1, col2 = st.columns(2)

    with col1:
        level_counts = alerts["Alert Level"].value_counts().reset_index()
        level_counts.columns = ["Alert Level", "Count"]
        level_order = [l for l in VALID_ALERT_LEVELS if l in level_counts["Alert Level"].values]
        level_counts["Alert Level"] = pd.Categorical(
            level_counts["Alert Level"], categories=level_order, ordered=True
        )
        level_counts = level_counts.sort_values("Alert Level")
        st.plotly_chart(
            bar_chart(level_counts, "Alert Level", "Count", "Alerts by Alert Level"),
            use_container_width=True,
        )

    with col2:
        loc_counts = alerts.groupby("Location").size().reset_index(name="Count")
        loc_counts = loc_counts.sort_values("Count", ascending=False)
        st.plotly_chart(
            bar_chart(loc_counts, "Location", "Count", "Alerts by Location"),
            use_container_width=True,
        )

    col3, col4 = st.columns(2)

    with col3:
        people_by_loc = alerts.groupby("Location")["Number of People"].sum().reset_index()
        people_by_loc = people_by_loc.sort_values("Number of People", ascending=False)
        st.plotly_chart(
            bar_chart(people_by_loc, "Location", "Number of People", "Affected People by Location"),
            use_container_width=True,
        )

    with col4:
        vol_by_loc = alerts.groupby("Location")["Volunteers Needed"].sum().reset_index()
        vol_by_loc = vol_by_loc.sort_values("Volunteers Needed", ascending=False)
        st.plotly_chart(
            bar_chart(vol_by_loc, "Location", "Volunteers Needed", "Volunteers Needed by Location"),
            use_container_width=True,
        )

    # Services chart from exploded response data
    service_counts = response_df["Service Needed"].value_counts().reset_index()
    service_counts.columns = ["Service Needed", "Count"]
    st.plotly_chart(
        bar_chart(service_counts, "Service Needed", "Count", "Required Services by Type"),
        use_container_width=True,
    )


def render_volunteer_charts(volunteers: pd.DataFrame, kpis: dict):
    """Charts for volunteer availability."""
    st.subheader("Volunteer Availability")

    available = volunteers[volunteers["Status"] == "Available"]

    col1, col2, col3 = st.columns(3)

    with col1:
        by_loc = available.groupby("Location").size().reset_index(name="Count")
        by_loc = by_loc.sort_values("Count", ascending=False)
        st.plotly_chart(
            bar_chart(by_loc, "Location", "Count", "Available Volunteers by Location"),
            use_container_width=True,
        )

    with col2:
        by_service = available.groupby("Service Type").size().reset_index(name="Count")
        st.plotly_chart(
            bar_chart(by_service, "Service Type", "Count", "Available Volunteers by Service"),
            use_container_width=True,
        )

    with col3:
        st.metric("Not Available Volunteers", kpis["not_available_volunteers"])

    # Location + service cross-tab
    cross = (
        available.groupby(["Location", "Service Type"])
        .size()
        .reset_index(name="Count")
    )
    if not cross.empty:
        fig = px.bar(
            cross,
            x="Location",
            y="Count",
            color="Service Type",
            barmode="group",
            title="Available Volunteers by Location and Service Type",
            color_discrete_map=COLORS,
        )
        fig.update_layout(margin=dict(t=40, b=20, l=20, r=20))
        st.plotly_chart(fig, use_container_width=True)


def style_alert_table(df: pd.DataFrame) -> pd.DataFrame.style:
    """Apply color styling to alert level column."""

    def color_alert_level(val):
        return f"color: {COLORS.get(val, 'black')}; font-weight: bold"

    return df.style.map(color_alert_level, subset=["Alert Level"])


def style_response_table(df: pd.DataFrame) -> pd.DataFrame.style:
    """Apply color styling to alert level and response status columns."""

    def color_alert_level(val):
        return f"color: {COLORS.get(val, 'black')}; font-weight: bold"

    def color_response(val):
        return f"color: {COLORS.get(val, 'black')}; font-weight: bold"

    return df.style.map(color_alert_level, subset=["Alert Level"]).map(
        color_response, subset=["Response Status"]
    )


def render_requests_tab(alerts_df: pd.DataFrame):
    """Tab 1: Flood alert requests with full details."""
    st.subheader("Emergency Requests")
    st.caption("All active flood alerts with service and location details.")

    col1, col2, col3 = st.columns(3)
    with col1:
        level_filter = st.multiselect(
            "Filter by Alert Level",
            options=sorted(alerts_df["Alert Level"].unique()),
            default=[],
            key="req_level",
        )
    with col2:
        loc_filter = st.multiselect(
            "Filter by Location",
            options=sorted(alerts_df["Location"].unique()),
            default=[],
            key="req_location",
        )
    with col3:
        service_filter = st.multiselect(
            "Filter by Service Needed",
            options=sorted(
                {s.strip() for cell in alerts_df["Service Needed"] for s in cell.split(",")}
            ),
            default=[],
            key="req_service",
        )

    filtered = sort_alerts_by_priority(alerts_df)
    if level_filter:
        filtered = filtered[filtered["Alert Level"].isin(level_filter)]
    if loc_filter:
        filtered = filtered[filtered["Location"].isin(loc_filter)]
    if service_filter:
        filtered = filtered[
            filtered["Service Needed"].apply(
                lambda x: any(s.strip() in service_filter for s in x.split(","))
            )
        ]

    display_cols = [
        "Alert ID",
        "Alert Type",
        "Alert Level",
        "Location",
        "Service Needed",
        "Number of People",
        "Volunteers Needed",
    ]
    st.caption(f"Showing {len(filtered)} of {len(alerts_df)} requests")
    st.dataframe(
        style_alert_table(filtered[display_cols]),
        use_container_width=True,
        hide_index=True,
    )

    st.markdown("#### Request Details")
    for _, row in filtered.head(20).iterrows():
        with st.expander(
            f"{row['Alert ID']} — {row['Alert Level']} — {row['Location']} ({row['Service Needed']})"
        ):
            c1, c2 = st.columns(2)
            c1.markdown(f"**Alert Type:** {row['Alert Type']}")
            c1.markdown(f"**Alert Level:** {row['Alert Level']}")
            c1.markdown(f"**Location:** {row['Location']}")
            c2.markdown(f"**People Affected:** {row['Number of People']}")
            c2.markdown(f"**Volunteers Needed:** {row['Volunteers Needed']}")
            c2.markdown(f"**Services Required:** {row['Service Needed']}")


def render_volunteers_tab(volunteers_df: pd.DataFrame, kpis: dict):
    """Tab 2: Volunteer roster."""
    st.subheader("Volunteer Roster")
    st.caption("All registered volunteers and their availability.")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Volunteers", volunteers_df["Volunteer ID"].nunique())
    c2.metric("Available", kpis["total_available_volunteers"])
    c3.metric("Not Available", kpis["not_available_volunteers"])
    c4.metric("Locations Covered", volunteers_df["Location"].nunique())

    col1, col2, col3 = st.columns(3)
    with col1:
        status_filter = st.multiselect(
            "Filter by Status",
            options=sorted(volunteers_df["Status"].unique()),
            default=[],
            key="vol_status",
        )
    with col2:
        loc_filter = st.multiselect(
            "Filter by Location",
            options=sorted(volunteers_df["Location"].unique()),
            default=[],
            key="vol_location",
        )
    with col3:
        service_filter = st.multiselect(
            "Filter by Service Type",
            options=sorted(volunteers_df["Service Type"].unique()),
            default=[],
            key="vol_service",
        )

    filtered = volunteers_df.copy()
    if status_filter:
        filtered = filtered[filtered["Status"].isin(status_filter)]
    if loc_filter:
        filtered = filtered[filtered["Location"].isin(loc_filter)]
    if service_filter:
        filtered = filtered[filtered["Service Type"].isin(service_filter)]

    volunteer_list = build_volunteer_list(filtered)
    st.caption(f"Showing {len(volunteer_list)} volunteers")
    st.dataframe(volunteer_list, use_container_width=True, hide_index=True)


def render_matching_tab(connection_df: pd.DataFrame):
    """Tab 3: Connect volunteers to requests by service and location."""
    st.subheader("Volunteer–Request Matching")
    st.caption(
        "Each row links a request to available volunteers who match the location and required service."
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        level_filter = st.multiselect(
            "Alert Level",
            options=sorted(connection_df["Alert Level"].unique()),
            default=[],
            key="match_level",
        )
    with col2:
        loc_filter = st.multiselect(
            "Location",
            options=sorted(connection_df["Location"].unique()),
            default=[],
            key="match_location",
        )
    with col3:
        service_filter = st.multiselect(
            "Service Needed",
            options=sorted(connection_df["Service Needed"].unique()),
            default=[],
            key="match_service",
        )
    with col4:
        status_filter = st.multiselect(
            "Response Status",
            options=VALID_RESPONSE_STATUSES,
            default=[],
            key="match_status",
        )

    filtered = apply_filters(connection_df, level_filter, loc_filter, service_filter, status_filter)

    display_cols = [
        "Alert ID",
        "Alert Level",
        "Location",
        "Service Needed",
        "Volunteers Needed",
        "Matched Volunteer IDs",
        "Matched Volunteer Names",
        "Matched Count",
        "Missing Volunteers",
        "Response Status",
    ]
    st.caption(f"Showing {len(filtered)} of {len(connection_df)} connections")
    st.dataframe(
        style_response_table(filtered[display_cols]),
        use_container_width=True,
        hide_index=True,
    )

    # Highlight uncovered requests
    uncovered = filtered[filtered["Response Status"] == "Not Covered"]
    if not uncovered.empty:
        st.warning(f"{len(uncovered)} request-service pairs have no available volunteers.")
        st.dataframe(
            uncovered[["Alert ID", "Location", "Service Needed", "Volunteers Needed"]],
            use_container_width=True,
            hide_index=True,
        )


def render_report_tab(
    alerts_df: pd.DataFrame,
    volunteers_df: pd.DataFrame,
    response_df: pd.DataFrame,
    connection_df: pd.DataFrame,
    kpis: dict,
):
    """Tab 4: Summary report with KPIs, charts, and coverage breakdown."""
    st.subheader("Report & Summary")

    render_kpi_row(kpis)
    st.divider()

    # Coverage summary
    st.markdown("#### Response Coverage")
    col1, col2, col3 = st.columns(3)
    status_counts = response_df["Response Status"].value_counts()
    col1.metric("Covered", status_counts.get("Covered", 0))
    col2.metric("Partially Covered", status_counts.get("Partially Covered", 0))
    col3.metric("Not Covered", status_counts.get("Not Covered", 0))

    # Pie chart for response status
    if not response_df.empty:
        pie_df = status_counts.reset_index()
        pie_df.columns = ["Response Status", "Count"]
        fig = px.pie(
            pie_df,
            names="Response Status",
            values="Count",
            title="Response Status Distribution",
            color="Response Status",
            color_discrete_map=COLORS,
        )
        st.plotly_chart(fig, use_container_width=True)

    st.divider()

    st.markdown("#### High Priority Alerts")
    high_priority = response_df[response_df["Alert Level"] == "High"].head(10)
    if high_priority.empty:
        st.info("No High-level alerts at this time.")
    else:
        st.dataframe(style_response_table(high_priority), use_container_width=True, hide_index=True)

    st.divider()
    render_alert_charts(alerts_df, response_df)

    st.divider()
    render_volunteer_charts(volunteers_df, kpis)

    st.divider()
    st.markdown("#### Full Response Table")
    st.dataframe(
        style_response_table(response_df),
        use_container_width=True,
        hide_index=True,
    )


def main():
    st.set_page_config(
        page_title="Flood Emergency Response Dashboard",
        page_icon="🌊",
        layout="wide",
    )
    inject_custom_css()

    st.markdown('<p class="main-header">Flood Emergency Response Dashboard</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="sub-header">Monitor flood alerts, volunteer coverage, and response status in real time.</p>',
        unsafe_allow_html=True,
    )

    # --- Sidebar: file upload ---
    st.sidebar.header("Data Source")
    uploaded_file = st.sidebar.file_uploader(
        "Upload Excel file (.xlsx)",
        type=["xlsx"],
        help="Excel file must contain Flood Alerts and Volunteers sheets.",
    )

    use_sample = st.sidebar.checkbox("Use bundled sample data", value=uploaded_file is None)

    alerts_df = None
    volunteers_df = None

    try:
        if uploaded_file is not None:
            alerts_df, volunteers_df = load_excel_data(uploaded_file)
            st.sidebar.success("Excel file loaded successfully.")
        elif use_sample and SAMPLE_DATA_PATH.exists():
            alerts_df, volunteers_df = load_excel_data(SAMPLE_DATA_PATH)
            st.sidebar.info("Using sample_data.xlsx")
        elif use_sample:
            st.sidebar.warning("sample_data.xlsx not found. Please upload an Excel file.")
            st.stop()
        else:
            st.info("Upload an Excel file from the sidebar to begin.")
            st.stop()

        # Validate required columns
        missing_alerts = validate_columns(alerts_df, ALERT_REQUIRED_COLUMNS, "Flood Alerts")
        missing_volunteers = validate_columns(volunteers_df, VOLUNTEER_REQUIRED_COLUMNS, "Volunteers")

        if missing_alerts:
            st.error(
                f"**Flood Alerts** sheet is missing required columns: {', '.join(missing_alerts)}"
            )
            st.stop()
        if missing_volunteers:
            st.error(
                f"**Volunteers** sheet is missing required columns: {', '.join(missing_volunteers)}"
            )
            st.stop()

        alerts_df, volunteers_df = coerce_numeric_columns(alerts_df, volunteers_df)

        # Drop alerts with no services listed
        alerts_df = alerts_df[alerts_df["Service Needed"].str.len() > 0].copy()

        if alerts_df.empty:
            st.warning("No valid flood alerts found after cleaning the data.")
            st.stop()

        # Build response table and KPIs
        response_df = build_response_table(alerts_df, volunteers_df)
        connection_df = build_connection_table(alerts_df, volunteers_df)
        kpis = compute_kpis(alerts_df, volunteers_df)

    except ValueError as exc:
        st.error(str(exc))
        st.stop()
    except Exception as exc:
        st.error(f"Failed to load data: {exc}")
        st.stop()

    # --- Tabbed interface ---
    tab_requests, tab_volunteers, tab_matching, tab_report = st.tabs(
        [
            "Requests",
            "Volunteers",
            "Matching",
            "Report & Summary",
        ]
    )

    with tab_requests:
        render_requests_tab(alerts_df)

    with tab_volunteers:
        render_volunteers_tab(volunteers_df, kpis)

    with tab_matching:
        render_matching_tab(connection_df)

    with tab_report:
        render_report_tab(
            alerts_df, volunteers_df, response_df, connection_df, kpis
        )


if __name__ == "__main__":
    main()

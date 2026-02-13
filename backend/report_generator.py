"""PDF Report Generator for LandWatch compliance reports."""
import io
import base64
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_pdf_report(analysis: dict) -> io.BytesIO:
    """Generate a professional PDF compliance report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=30 * mm,
        bottomMargin=25 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Title'],
        fontSize=22, textColor=colors.HexColor('#1a365d'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'CustomSubtitle', parent=styles['Normal'],
        fontSize=11, textColor=colors.HexColor('#4a5568'),
        spaceAfter=20
    )
    heading_style = ParagraphStyle(
        'CustomHeading', parent=styles['Heading2'],
        fontSize=14, textColor=colors.HexColor('#2d3748'),
        spaceBefore=16, spaceAfter=8,
        borderColor=colors.HexColor('#3182ce'),
        borderWidth=0, borderPadding=4,
    )
    body_style = ParagraphStyle(
        'CustomBody', parent=styles['Normal'],
        fontSize=10, textColor=colors.HexColor('#2d3748'),
        spaceAfter=6, leading=14
    )
    small_style = ParagraphStyle(
        'SmallText', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#718096'),
    )

    elements = []
    summary = analysis.get("summary", {})
    metadata = analysis.get("metadata", {})
    deviations = analysis.get("deviations", [])
    recommendations = analysis.get("recommendations", [])

    # ── HEADER ──
    elements.append(Paragraph("CSIDC - LandWatch", title_style))
    elements.append(Paragraph("Automated Land Monitoring & Compliance Report", subtitle_style))
    elements.append(HRFlowable(
        width="100%", thickness=2,
        color=colors.HexColor('#3182ce'), spaceBefore=2, spaceAfter=12
    ))

    # ── REPORT META ──
    meta_data = [
        ["Report ID:", analysis.get("result_id", "N/A"),
         "Generated:", datetime.now().strftime("%d-%m-%Y %H:%M")],
        ["Reference File:", metadata.get("reference_filename", "N/A"),
         "Ref Dimensions:", metadata.get("reference_dimensions", "N/A")],
        ["Current File:", metadata.get("current_filename", "N/A"),
         "Cur Dimensions:", metadata.get("current_dimensions", "N/A")],
    ]
    meta_table = Table(meta_data, colWidths=[85, 150, 90, 150])
    meta_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4a5568')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#4a5568')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # ── RISK ASSESSMENT ──
    elements.append(Paragraph("1. Risk Assessment Summary", heading_style))

    risk_level = summary.get("risk_level", "Unknown")
    risk_color = {
        "Critical": colors.HexColor('#e53e3e'),
        "High": colors.HexColor('#dd6b20'),
        "Medium": colors.HexColor('#805ad5'),
        "Low": colors.HexColor('#38a169'),
    }.get(risk_level, colors.grey)

    risk_data = [
        ["Overall Risk Level", "Total Deviations", "Area Changed (%)", "Changed Pixels"],
        [risk_level, str(summary.get("total_deviations", 0)),
         f"{summary.get('change_percentage', 0)}%",
         f"{summary.get('changed_area_pixels', 0):,}"]
    ]
    risk_table = Table(risk_data, colWidths=[130, 120, 120, 120])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (0, 1), risk_color),
        ('TEXTCOLOR', (0, 1), (0, 1), colors.white),
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),
    ]))
    elements.append(risk_table)
    elements.append(Spacer(1, 16))

    # ── DEVIATIONS ──
    if deviations:
        elements.append(Paragraph("2. Detected Deviations", heading_style))

        dev_header = ["ID", "Type", "Severity", "Area (px)", "Location"]
        dev_rows = [dev_header]
        for dev in deviations:
            bbox = dev.get("bbox", {})
            dev_rows.append([
                dev.get("id", ""),
                dev.get("type", ""),
                dev.get("severity", ""),
                f"{dev.get('area_pixels', 0):,}",
                f"({bbox.get('x', 0)}, {bbox.get('y', 0)})"
            ])

        dev_table = Table(dev_rows, colWidths=[40, 170, 70, 80, 80])
        severity_colors = {
            "Critical": colors.HexColor('#fed7d7'),
            "High": colors.HexColor('#feebc8'),
            "Medium": colors.HexColor('#e9d8fd'),
            "Low": colors.HexColor('#c6f6d5'),
        }

        style_cmds = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (3, 0), (4, -1), 'CENTER'),
        ]
        for i, dev in enumerate(deviations):
            bg = severity_colors.get(dev.get("severity", ""), colors.white)
            style_cmds.append(('BACKGROUND', (2, i + 1), (2, i + 1), bg))

        dev_table.setStyle(TableStyle(style_cmds))
        elements.append(dev_table)
        elements.append(Spacer(1, 16))

    # ── RECOMMENDATIONS ──
    if recommendations:
        elements.append(Paragraph("3. Recommended Actions", heading_style))
        for i, rec in enumerate(recommendations):
            priority = rec.get("priority", "")
            p_color = {"Immediate": "#e53e3e", "High": "#dd6b20", "Medium": "#805ad5", "Low": "#38a169"}.get(priority, "#2d3748")
            elements.append(Paragraph(
                f'<font color="{p_color}"><b>[{priority}]</b></font> {rec.get("action", "")}',
                body_style
            ))
            elements.append(Paragraph(
                f'<font color="#718096"><i>Reason: {rec.get("reason", "")}</i></font>',
                small_style
            ))
            elements.append(Spacer(1, 6))

    # ── FOOTER ──
    elements.append(Spacer(1, 24))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e0')))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "This report was generated automatically by the LandWatch system. "
        "It is intended for internal CSIDC use only. All findings should be verified "
        "through ground-truthing before administrative action is taken.",
        small_style
    ))
    elements.append(Paragraph(
        f"Report generated on {datetime.now().strftime('%d-%m-%Y at %H:%M:%S')} | "
        "LandWatch v2.0 | Chhattisgarh State Industrial Development Corporation",
        small_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer

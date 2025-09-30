#!/bin/bash

# Portfolio PDF Generator Script
# This script helps convert the HTML portfolio to PDF

echo "🚀 Portfolio PDF Generator"
echo "========================="

# Check if we're in the right directory
if [ ! -f "portfolio/portfolio-pdf.html" ]; then
    echo "❌ Error: portfolio-pdf.html not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📄 Found portfolio HTML file"

# Method 1: Using Chrome/Chromium (recommended)
if command -v google-chrome &> /dev/null; then
    echo "🖥️  Using Google Chrome to generate PDF..."
    google-chrome --headless --disable-gpu --print-to-pdf=portfolio/autonomous-redteam-portfolio.pdf --print-to-pdf-no-header portfolio/portfolio-pdf.html
    echo "✅ PDF generated: portfolio/autonomous-redteam-portfolio.pdf"
elif command -v chromium &> /dev/null; then
    echo "🖥️  Using Chromium to generate PDF..."
    chromium --headless --disable-gpu --print-to-pdf=portfolio/autonomous-redteam-portfolio.pdf --print-to-pdf-no-header portfolio/portfolio-pdf.html
    echo "✅ PDF generated: portfolio/autonomous-redteam-portfolio.pdf"
elif command -v chromium-browser &> /dev/null; then
    echo "🖥️  Using Chromium Browser to generate PDF..."
    chromium-browser --headless --disable-gpu --print-to-pdf=portfolio/autonomous-redteam-portfolio.pdf --print-to-pdf-no-header portfolio/portfolio-pdf.html
    echo "✅ PDF generated: portfolio/autonomous-redteam-portfolio.pdf"
else
    echo "⚠️  Chrome/Chromium not found. Trying alternative methods..."
    
    # Method 2: Using wkhtmltopdf (if available)
    if command -v wkhtmltopdf &> /dev/null; then
        echo "📄 Using wkhtmltopdf to generate PDF..."
        wkhtmltopdf --page-size A4 --margin-top 0.75in --margin-right 0.75in --margin-bottom 0.75in --margin-left 0.75in portfolio/portfolio-pdf.html portfolio/autonomous-redteam-portfolio.pdf
        echo "✅ PDF generated: portfolio/autonomous-redteam-portfolio.pdf"
    else
        echo "❌ No PDF generation tools found!"
        echo ""
        echo "📋 Manual Options:"
        echo "1. Open portfolio/portfolio-pdf.html in your browser"
        echo "2. Press Ctrl+P (Cmd+P on Mac) to print"
        echo "3. Select 'Save as PDF' as destination"
        echo "4. Save as 'autonomous-redteam-portfolio.pdf'"
        echo ""
        echo "🔧 Install Chrome/Chromium for automatic PDF generation:"
        echo "   macOS: brew install --cask google-chrome"
        echo "   Ubuntu: sudo apt install google-chrome-stable"
        echo "   Or download from: https://www.google.com/chrome/"
        exit 1
    fi
fi

# Check if PDF was created successfully
if [ -f "portfolio/autonomous-redteam-portfolio.pdf" ]; then
    echo ""
    echo "🎉 Success! Portfolio PDF created:"
    echo "   📁 portfolio/autonomous-redteam-portfolio.pdf"
    echo ""
    echo "📊 File size: $(du -h portfolio/autonomous-redteam-portfolio.pdf | cut -f1)"
    echo ""
    echo "💡 You can now:"
    echo "   • Upload to job applications"
    echo "   • Share with recruiters"
    echo "   • Include in your portfolio"
    echo "   • Print for interviews"
else
    echo "❌ PDF generation failed!"
    echo "Please try the manual method described above."
fi
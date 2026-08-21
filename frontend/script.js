const API_URL =
    "https://ai-resume-analyzer-api-71xn.onrender.com";

const uploadZone = document.getElementById("uploadZone");
const browseBtn = document.getElementById("browseBtn");
const resumeFile = document.getElementById("resumeFile");

const selectedFile = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const removeFile = document.getElementById("removeFile");

const analyzeBtn = document.getElementById("analyzeBtn");
const buttonText = document.getElementById("buttonText");

const loading = document.getElementById("loading");
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const errorBox = document.getElementById("error");

const resultsSection =
    document.getElementById("resultsSection");

const result =
    document.getElementById("result");

const analyzeAgain =
    document.getElementById("analyzeAgain");

const targetRole =
    document.getElementById("targetRole");

let selectedResume = null;


// ============================================
// FILE BROWSE
// ============================================

browseBtn.addEventListener("click", function (event) {

    event.stopPropagation();

    resumeFile.click();

});


// ============================================
// CLICK UPLOAD ZONE
// ============================================

uploadZone.addEventListener("click", function (event) {

    if (
        event.target === browseBtn ||
        browseBtn.contains(event.target)
    ) {
        return;
    }

    resumeFile.click();

});


// ============================================
// FILE SELECTED
// ============================================

resumeFile.addEventListener("change", function () {

    const file = resumeFile.files[0];

    if (!file) {
        return;
    }

    handleFile(file);

});


// ============================================
// HANDLE FILE
// ============================================

function handleFile(file) {

    clearError();

    if (file.type !== "application/pdf") {

        showError(
            "Please upload a valid PDF file."
        );

        resetFile();

        return;
    }


    // 10 MB limit

    const maxSize =
        10 * 1024 * 1024;

    if (file.size > maxSize) {

        showError(
            "PDF file must be smaller than 10MB."
        );

        resetFile();

        return;
    }


    selectedResume = file;


    fileName.textContent =
        file.name;

    fileSize.textContent =
        formatFileSize(file.size);


    selectedFile.style.display =
        "flex";


    uploadZone.style.display =
        "none";


    analyzeBtn.disabled =
        false;

}


// ============================================
// FORMAT FILE SIZE
// ============================================

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }

    if (bytes < 1024 * 1024) {

        return (
            (bytes / 1024).toFixed(1)
            + " KB"
        );

    }

    return (
        (bytes / (1024 * 1024)).toFixed(2)
        + " MB"
    );

}


// ============================================
// REMOVE FILE
// ============================================

removeFile.addEventListener("click", function () {

    resetFile();

});


// ============================================
// RESET FILE
// ============================================

function resetFile() {

    selectedResume = null;

    resumeFile.value = "";

    selectedFile.style.display =
        "none";

    uploadZone.style.display =
        "flex";

    analyzeBtn.disabled =
        true;

}


// ============================================
// ANALYZE RESUME
// ============================================

analyzeBtn.addEventListener(
    "click",
    analyzeResume
);


async function analyzeResume() {

    if (!selectedResume) {

        showError(
            "Please upload a PDF resume."
        );

        return;
    }


    clearError();

    resultsSection.style.display =
        "none";


    // Loading state

    analyzeBtn.disabled =
        true;

    buttonText.textContent =
        "Analyzing...";


    loading.style.display =
        "flex";


    loadingTitle.textContent =
        "Analyzing your resume...";

    loadingText.textContent =
        "Uploading your resume to the AI analyzer.";


    try {

        const formData =
            new FormData();


        formData.append(
            "file",
            selectedResume
        );


        formData.append(
            "target_role",
            targetRole.value
        );


        loadingText.textContent =
            "AI is reviewing your resume.";


        const response =
            await fetch(
                `${API_URL}/analyze`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        console.log(
            "API Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data?.error ||
                `Server error (${response.status})`
            );

        }


        if (!data.success) {
            throw new Error(
                data.error || "Unable to analyze the resume right now. Please try again later."
            );
        }


        loadingTitle.textContent =
            "Analysis complete!";

        loadingText.textContent =
            "Preparing your resume insights.";


        displayResult(
            data.analysis,
            data.target_role
        );


        resultsSection.style.display =
            "block";


        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    }
    catch (error) {

        console.error(
            "Analysis Error:",
            error
        );


        showError(
            error.message ||
            "Something went wrong while analyzing your resume."
        );

    }
    finally {

        loading.style.display =
            "none";

        analyzeBtn.disabled =
            false;

        buttonText.textContent =
            "Analyze Resume";

    }

}


// ============================================
// DISPLAY RESULT
// ============================================

function displayResult(
    analysis,
    role
) {

    if (!analysis) {

        showError(
            "No analysis data was returned."
        );

        return;
    }


    const technicalSkills =
        Array.isArray(
            analysis.technical_skills
        )
            ? analysis.technical_skills
            : [];


    const softSkills =
        Array.isArray(
            analysis.soft_skills
        )
            ? analysis.soft_skills
            : [];


    const strengths =
        Array.isArray(
            analysis.strengths
        )
            ? analysis.strengths
            : [];


    const missingSkills =
        Array.isArray(
            analysis.missing_skills
        )
            ? analysis.missing_skills
            : [];


    const missingKeywords =
        Array.isArray(
            analysis.missing_keywords
        )
            ? analysis.missing_keywords
            : [];


    const suggestions =
        Array.isArray(
            analysis.suggestions
        )
            ? analysis.suggestions
            : [];


    const roleMatch =
        analysis.job_role_match || {};


    result.innerHTML = `

        <div class="score-highlight">

            <div class="score-circle">

                <strong>
                    ${escapeHTML(
        String(
            analysis.ats_score ?? 0
        )
    )}
                </strong>

                <span>/100</span>

            </div>

            <div class="score-info">

                <span class="score-label">
                    ATS SCORE
                </span>

                <h3>
                    Resume Score
                </h3>

                <p>
                    Based on ATS compatibility,
                    keywords and resume quality.
                </p>

            </div>

        </div>


        <div class="score-grid">

            ${scoreCard(
        "ATS Score",
        analysis.ats_score
    )}

            ${scoreCard(
        "Keyword Score",
        analysis.keyword_score
    )}

            ${scoreCard(
        "Skills Match",
        analysis.skills_match_score
    )}

        </div>


        <div class="result-card">

            <h3>
                🛠 Technical Skills
            </h3>

            ${renderTags(
        technicalSkills
    )}

        </div>


        <div class="result-card">

            <h3>
                🧠 Soft Skills
            </h3>

            ${renderTags(
        softSkills
    )}

        </div>


        <div class="result-card">

            <h3>
                💪 Strengths
            </h3>

            ${renderList(
        strengths
    )}

        </div>


        <div class="result-card warning-card">

            <h3>
                ⚠️ Missing Skills
            </h3>

            ${renderList(
        missingSkills
    )}

        </div>


        <div class="result-card">

            <h3>
                🔎 Missing ATS Keywords
            </h3>

            ${renderTags(
        missingKeywords,
        "keyword-tag"
    )}

        </div>


        <div class="result-card match-card">

            <h3>
                🎯 Job Role Match
            </h3>

            <div class="match-score">

                ${escapeHTML(
        String(
            roleMatch.match_percentage ?? 0
        )
    )}%

                <span>Match</span>

            </div>

            <h4>
                ${escapeHTML(
        roleMatch.role ||
        role ||
        "Target Role"
    )}
            </h4>

            <p>
                ${escapeHTML(
        roleMatch.explanation ||
        "No explanation provided."
    )}
            </p>

        </div>


        <div class="result-card">

            <h3>
                💡 Suggestions
            </h3>

            ${renderList(
        suggestions
    )}

        </div>


        <div class="overall-card">

            <h3>
                📋 Overall Assessment
            </h3>

            <p>
                ${escapeHTML(
        analysis.overall_summary ||
        "No overall summary provided."
    )}
            </p>

        </div>

    `;

}


// ============================================
// SCORE CARD
// ============================================

function scoreCard(
    title,
    score
) {

    return `

        <div class="score-card">

            <span>
                ${escapeHTML(title)}
            </span>

            <strong>
                ${escapeHTML(
        String(score ?? 0)
    )}
            </strong>

            <small>
                /100
            </small>

        </div>

    `;

}


// ============================================
// RENDER TAGS
// ============================================

function renderTags(
    items,
    className = "skill-tag"
) {

    if (!items.length) {

        return `
            <p class="empty-result">
                No items found.
            </p>
        `;

    }


    return `

        <div class="tags">

            ${items
            .map(
                item => `
                        <span class="${className}">
                            ${escapeHTML(
                    String(item)
                )}
                        </span>
                    `
            )
            .join("")
        }

        </div>

    `;

}


// ============================================
// RENDER LIST
// ============================================

function renderList(items) {

    if (!items.length) {

        return `
            <p class="empty-result">
                No items found.
            </p>
        `;

    }


    return `

        <ul class="result-list">

            ${items
            .map(
                item => `
                        <li>
                            ${escapeHTML(
                    String(item)
                )}
                        </li>
                    `
            )
            .join("")
        }

        </ul>

    `;

}


// ============================================
// ERROR
// ============================================

function showError(message) {

    errorBox.textContent =
        message;

    errorBox.style.display =
        "block";

    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


function clearError() {

    errorBox.textContent =
        "";

    errorBox.style.display =
        "none";

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ============================================
// ANALYZE ANOTHER RESUME
// ============================================

analyzeAgain.addEventListener(
    "click",
    function () {

        resultsSection.style.display =
            "none";

        resetFile();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);
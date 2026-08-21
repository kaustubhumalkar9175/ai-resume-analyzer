// =========================================================
// CONFIGURATION
// =========================================================

// Local development
const API_BASE_URL = "http://127.0.0.1:8000";

// Later, after deployment, change this to:
//
// const API_BASE_URL = "https://your-api-domain.com";


// =========================================================
// ELEMENTS
// =========================================================

const uploadZone =
    document.getElementById("uploadZone");

const browseBtn =
    document.getElementById("browseBtn");

const resumeFile =
    document.getElementById("resumeFile");

const selectedFile =
    document.getElementById("selectedFile");

const fileName =
    document.getElementById("fileName");

const fileSize =
    document.getElementById("fileSize");

const removeFile =
    document.getElementById("removeFile");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const analyzeAgain =
    document.getElementById("analyzeAgain");

const targetRole =
    document.getElementById("targetRole");

const loading =
    document.getElementById("loading");

const loadingTitle =
    document.getElementById("loadingTitle");

const loadingText =
    document.getElementById("loadingText");

const errorBox =
    document.getElementById("error");

const resultsSection =
    document.getElementById("resultsSection");

const result =
    document.getElementById("result");

const buttonText =
    document.getElementById("buttonText");


// =========================================================
// STATE
// =========================================================

let selectedResume = null;

let isAnalyzing = false;


// =========================================================
// FILE SIZE
// =========================================================

const MAX_FILE_SIZE =
    10 * 1024 * 1024;


// =========================================================
// BROWSE BUTTON
// =========================================================

browseBtn.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        resumeFile.click();

    }
);


// =========================================================
// UPLOAD ZONE CLICK
// =========================================================

uploadZone.addEventListener(
    "click",
    function (event) {

        if (
            event.target === browseBtn
        ) {
            return;
        }

        resumeFile.click();

    }
);


// =========================================================
// FILE SELECTED
// =========================================================

resumeFile.addEventListener(
    "change",
    function () {

        const file =
            resumeFile.files[0];

        handleFile(file);

    }
);


// =========================================================
// HANDLE FILE
// =========================================================

function handleFile(file) {

    hideError();

    if (!file) {
        return;
    }


    // Validate type

    if (
        file.type !== "application/pdf" &&
        !file.name
            .toLowerCase()
            .endsWith(".pdf")
    ) {

        showError(
            "Please select a PDF file."
        );

        resetFile();

        return;
    }


    // Validate size

    if (
        file.size > MAX_FILE_SIZE
    ) {

        showError(
            "File is too large. Maximum size is 10 MB."
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


// =========================================================
// REMOVE FILE
// =========================================================

removeFile.addEventListener(
    "click",
    function () {

        resetFile();

    }
);


// =========================================================
// RESET FILE
// =========================================================

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


// =========================================================
// FORMAT FILE SIZE
// =========================================================

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }

    if (bytes < 1024 * 1024) {

        return (
            (bytes / 1024)
                .toFixed(1)
            + " KB"
        );

    }

    return (
        (bytes / (1024 * 1024))
            .toFixed(2)
        + " MB"
    );

}


// =========================================================
// ANALYZE BUTTON
// =========================================================

analyzeBtn.addEventListener(
    "click",
    analyzeResume
);


// =========================================================
// ANALYZE RESUME
// =========================================================

async function analyzeResume() {

    if (isAnalyzing) {
        return;
    }


    if (!selectedResume) {

        showError(
            "Please upload a PDF resume."
        );

        return;
    }


    hideError();


    isAnalyzing = true;

    analyzeBtn.disabled = true;

    analyzeAgain.disabled = true;


    loading.style.display =
        "flex";


    resultsSection.style.display =
        "none";


    buttonText.textContent =
        "Analyzing...";


    loadingTitle.textContent =
        "Analyzing your resume...";


    loadingText.textContent =
        "AI is reviewing your skills and experience.";


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


        const response =
            await fetch(
                `${API_BASE_URL}/analyze`,
                {
                    method: "POST",
                    body: formData
                }
            );


        let data;


        try {

            data =
                await response.json();

        }
        catch {

            throw new Error(
                "Server returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(
                data?.detail ||
                data?.error ||
                `Server error (${response.status})`
            );

        }


        if (!data.success) {

            throw new Error(
                data.error ||
                "Resume analysis failed."
            );

        }


        displayResult(
            data.analysis,
            data.target_role
        );


        resultsSection.style.display =
            "block";


        resultsSection.scrollIntoView({
            behavior: "smooth"
        });

    }
    catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        showError(
            getFriendlyError(error)
        );

    }
    finally {

        isAnalyzing = false;

        analyzeBtn.disabled =
            false;

        analyzeAgain.disabled =
            false;

        loading.style.display =
            "none";

        buttonText.textContent =
            "Analyze Resume";

    }

}


// =========================================================
// FRIENDLY ERROR
// =========================================================

function getFriendlyError(error) {

    const message =
        error?.message || "";


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "Unable to connect to the AI server. " +
            "Please make sure the FastAPI backend is running."
        );

    }


    if (
        message.includes("429")
    ) {

        return (
            "The AI service is temporarily busy. " +
            "Please wait a moment and try again."
        );

    }


    return message ||
        "Something went wrong. Please try again.";

}


// =========================================================
// DISPLAY RESULT
// =========================================================

function displayResult(
    analysis,
    role
) {

    result.innerHTML = "";


    // ATS SCORE

    const score =
        Number(
            analysis.ats_score || 0
        );


    result.innerHTML += `

        <div class="score-card">

            <div class="score-circle">

                <strong>
                    ${score}
                </strong>

                <span>
                    /100
                </span>

            </div>

            <div>

                <span class="result-label">
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

    `;


    // SCORE CARDS

    result.innerHTML += `

        <div class="score-grid">

            ${scoreBox(
                "ATS Score",
                analysis.ats_score
            )}

            ${scoreBox(
                "Keyword Score",
                analysis.keyword_score
            )}

            ${scoreBox(
                "Skills Match",
                analysis.skills_match_score
            )}

        </div>

    `;


    // TECHNICAL SKILLS

    result.innerHTML +=
        createTagSection(
            "🛠️",
            "Technical Skills",
            analysis.technical_skills
        );


    // SOFT SKILLS

    result.innerHTML +=
        createTagSection(
            "🤝",
            "Soft Skills",
            analysis.soft_skills
        );


    // STRENGTHS

    result.innerHTML +=
        createListSection(
            "💪",
            "Strengths",
            analysis.strengths
        );


    // MISSING SKILLS

    result.innerHTML +=
        createWarningSection(
            "⚠️",
            "Missing Skills",
            analysis.missing_skills
        );


    // MISSING KEYWORDS

    result.innerHTML +=
        createTagSection(
            "🔎",
            "Missing ATS Keywords",
            analysis.missing_keywords,
            "warning"
        );


    // JOB MATCH

    const jobMatch =
        analysis.job_role_match;


    result.innerHTML += `

        <div class="job-match">

            <h3>
                🎯 Job Role Match
            </h3>

            <div class="match-score">
                ${jobMatch.match_percentage}%
            </div>

            <strong>
                ${escapeHTML(
                    jobMatch.role || role
                )}
            </strong>

            <p>
                ${escapeHTML(
                    jobMatch.explanation || ""
                )}
            </p>

        </div>

    `;


    // SUGGESTIONS

    result.innerHTML +=
        createListSection(
            "💡",
            "Suggestions",
            analysis.suggestions
        );


    // OVERALL

    result.innerHTML += `

        <div class="overall-card">

            <h3>
                📋 Overall Assessment
            </h3>

            <p>
                ${escapeHTML(
                    analysis.overall_summary || ""
                )}
            </p>

        </div>

    `;

}


// =========================================================
// SCORE BOX
// =========================================================

function scoreBox(
    title,
    value
) {

    return `

        <div class="score-box">

            <span>
                ${escapeHTML(title)}
            </span>

            <strong>
                ${Number(value) || 0}
            </strong>

            <small>
                /100
            </small>

        </div>

    `;

}


// =========================================================
// TAG SECTION
// =========================================================

function createTagSection(
    icon,
    title,
    items,
    type = ""
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return "";

    }


    const tags =
        items
            .map(
                item =>
                    `
                    <span class="skill-tag ${type}">
                        ${escapeHTML(item)}
                    </span>
                    `
            )
            .join("");


    return `

        <div class="analysis-card">

            <h3>
                ${icon} ${title}
            </h3>

            <div class="skill-tags">
                ${tags}
            </div>

        </div>

    `;

}


// =========================================================
// LIST SECTION
// =========================================================

function createListSection(
    icon,
    title,
    items
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return "";

    }


    const list =
        items
            .map(
                item =>
                    `
                    <li>
                        ${escapeHTML(item)}
                    </li>
                    `
            )
            .join("");


    return `

        <div class="analysis-card">

            <h3>
                ${icon} ${title}
            </h3>

            <ul>
                ${list}
            </ul>

        </div>

    `;

}


// =========================================================
// WARNING SECTION
// =========================================================

function createWarningSection(
    icon,
    title,
    items
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return "";

    }


    return `

        <div class="analysis-card warning-card">

            <h3>
                ${icon} ${title}
            </h3>

            <ul>

                ${items
                    .map(
                        item =>
                            `
                            <li>
                                ${escapeHTML(item)}
                            </li>
                            `
                    )
                    .join("")}

            </ul>

        </div>

    `;

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


// =========================================================
// ERROR
// =========================================================

function showError(message) {

    errorBox.textContent =
        message;

    errorBox.style.display =
        "block";

}


function hideError() {

    errorBox.textContent =
        "";

    errorBox.style.display =
        "none";

}


// =========================================================
// ANALYZE ANOTHER
// =========================================================

analyzeAgain.addEventListener(
    "click",
    function () {

        resultsSection.style.display =
            "none";

        resetFile();

        hideError();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// =========================================================
// DRAG & DROP
// =========================================================

uploadZone.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadZone.classList.add(
            "dragging"
        );

    }
);


uploadZone.addEventListener(
    "dragleave",
    function () {

        uploadZone.classList.remove(
            "dragging"
        );

    }
);


uploadZone.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        uploadZone.classList.remove(
            "dragging"
        );


        const file =
            event.dataTransfer.files[0];


        handleFile(file);

    }
);
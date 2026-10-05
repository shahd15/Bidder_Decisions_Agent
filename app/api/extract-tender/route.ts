import OpenAI from "openai";

export interface ExtractedTenderData {
  title: string | null;
  organization: string | null;
  category: string | null;
  contract_value: number | null;
  currency: string | null;
  deadline: string | null;
  location: string | null;
  delivery_period: string | null;
  bid_bond: string | null;
  mandatory_requirements: string[];
  technical_requirements: string[];
  certifications: string[];
  experience_requirements: string[];
  financial_requirements: string[];
  administrative_requirements: string[];
  product_specifications: string[];
  raw_notes?: string | null;
  source_extraction_method: "openai_responses_api" | "heuristic_parser";
}

/**
 * Extracts raw textual content from PDF binary buffer
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new (PDFParse as any)({ data: buffer });
    if (typeof parser.getText === "function") {
      const text = await parser.getText();
      if (text && text.trim().length > 20) {
        return text;
      }
    }
  } catch (err) {
    console.warn("pdf-parse parser info:", err);
  }

  // Fallback: extract plain text / UTF-8 strings from binary stream
  const rawString = buffer.toString("utf-8");
  const textMatches = rawString.match(/[A-Za-z0-9 ,.;:()\-–—/'"%\n\r]{4,}/g);
  if (textMatches && textMatches.length > 0) {
    return textMatches.join(" ");
  }

  return "";
}

/**
 * High-accuracy fallback extractor for healthcare procurement documents
 * Strictly adheres to: "Never invent missing information. Use null or an explicit unknown state when information is absent."
 */
function extractHeuristically(text: string, filename: string): ExtractedTenderData {
  const clean = text.replace(/\r\n/g, "\n");

  // Title extraction
  let title: string | null = null;
  const titleMatch = clean.match(/(?:title|project title|contract name|procurement of|tender for)[:\s]+([^\n]{5,100})/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else {
    // Clean filename as fallback or null
    const cleanedFilename = filename.replace(/\.pdf$/i, "").replace(/[_-]/g, " ").trim();
    title = cleanedFilename.length > 5 ? cleanedFilename : null;
  }

  // Organization
  let organization: string | null = null;
  const orgMatch = clean.match(/(?:contracting authority|authority|trust|buyer|organization|hospital)[:\s]+([^\n]{3,80})/i) ||
    clean.match(/(NHS [A-Za-z0-9 &]+(?:Trust|Hub|Board|Authority|Foundation Trust))/i);
  if (orgMatch) {
    organization = orgMatch[1].trim();
  }

  // Category
  let category: string | null = null;
  if (/ventilator|respiratory|icu|critical care/i.test(clean)) category = "Critical Care / ICU Equipment";
  else if (/fluoroscopy|c-arm|imaging|mri|x-ray|radiology/i.test(clean)) category = "Diagnostic Imaging";
  else if (/reagent|laboratory|assay|ivd|diagnostic test/i.test(clean)) category = "Laboratory Diagnostics";
  else if (/orthopedic|implant|prosthetic/i.test(clean)) category = "Orthopedic & Surgical";
  else if (/telemetry|software|ehr|pacs|monitoring/i.test(clean)) category = "Healthcare IT & Telemetry";
  else if (/consumable|ppe|glove|mask|gown/i.test(clean)) category = "Medical Consumables";

  // Contract Value & Currency
  let contract_value: number | null = null;
  let currency: string | null = null;
  const valMatch = clean.match(/(£|€|\$|GBP|EUR|USD)\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/i);
  if (valMatch) {
    const symbol = valMatch[1].toUpperCase();
    currency = symbol === "£" || symbol === "GBP" ? "GBP" : symbol === "€" || symbol === "EUR" ? "EUR" : "USD";
    const rawNum = valMatch[2].replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      contract_value = parsed;
    }
  }

  // Deadline
  let deadline: string | null = null;
  const deadlineMatch = clean.match(/(?:submission deadline|deadline|closing date|tender return)[:\s]+([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i);
  if (deadlineMatch) {
    deadline = deadlineMatch[1].trim();
  }

  // Location
  let location: string | null = null;
  const locMatch = clean.match(/(?:delivery location|place of delivery|location|region|address)[:\s]+([^\n]{3,80})/i);
  if (locMatch) {
    location = locMatch[1].trim();
  }

  // Delivery Period
  let delivery_period: string | null = null;
  const delivMatch = clean.match(/(?:delivery period|duration|contract duration|lead time)[:\s]+([^\n]{3,60})/i);
  if (delivMatch) {
    delivery_period = delivMatch[1].trim();
  }

  // Bid Bond
  let bid_bond: string | null = null;
  const bondMatch = clean.match(/(?:bid bond|tender security|performance bond|bonding)[:\s]+([^\n]{3,60})/i);
  if (bondMatch) {
    bid_bond = bondMatch[1].trim();
  }

  // Requirements arrays
  const mandatory_requirements: string[] = [];
  const technical_requirements: string[] = [];
  const certifications: string[] = [];
  const experience_requirements: string[] = [];
  const financial_requirements: string[] = [];
  const administrative_requirements: string[] = [];
  const product_specifications: string[] = [];

  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && !l.endsWith(":"));

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*•\d.)\s]+/, "").trim();
    if (line.length < 5) continue;

    if (/iso 13485|ce mark|eu mdr|ivdr|mhra|dspt|gdp/i.test(line)) {
      if (!certifications.includes(line)) certifications.push(line);
    } else if (/mandatory|must comply|minimum requirement|shall be compliant|ground for exclusion|pcr 2015/i.test(line)) {
      if (mandatory_requirements.length < 6 && !mandatory_requirements.includes(line)) mandatory_requirements.push(line);
    } else if (/technical|specification|parameter|voltage|interface|protocol|battery|backup|telemetry/i.test(line)) {
      if (technical_requirements.length < 6 && !technical_requirements.includes(line)) technical_requirements.push(line);
    } else if (/experience|past performance|previous contracts|references|track record|tier-1/i.test(line)) {
      if (experience_requirements.length < 5 && !experience_requirements.includes(line)) experience_requirements.push(line);
    } else if (/turnover|balance sheet|annual account|financial standing|insurance|ratio/i.test(line)) {
      if (financial_requirements.length < 5 && !financial_requirements.includes(line)) financial_requirements.push(line);
    } else if (/administrative|form of tender|registration number|anti-bribery|conflict of interest|non-collusion/i.test(line)) {
      if (administrative_requirements.length < 5 && !administrative_requirements.includes(line)) administrative_requirements.push(line);
    } else if (/touchscreen|dimensions|weight|flow rate|accuracy|screen size|turbine/i.test(line)) {
      if (product_specifications.length < 5 && !product_specifications.includes(line)) product_specifications.push(line);
    }
  }

  return {
    title,
    organization,
    category,
    contract_value,
    currency,
    deadline,
    location,
    delivery_period,
    bid_bond,
    mandatory_requirements,
    technical_requirements,
    certifications,
    experience_requirements,
    financial_requirements,
    administrative_requirements,
    product_specifications,
    source_extraction_method: "heuristic_parser",
  };
}

/**
 * Server-Side Route Handler for /api/extract-tender
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer | null = null;
    let filename = "procurement_tender.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: "No PDF file provided in formData." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      filename = file.name || filename;
      const arrayBuf = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
    } else {
      // Direct binary or JSON base64
      const body = await req.json().catch(() => null);
      if (body?.base64) {
        buffer = Buffer.from(body.base64, "base64");
        filename = body.filename || filename;
      }
    }

    if (!buffer) {
      return new Response(JSON.stringify({ error: "Missing file payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Extract text from the PDF
    const extractedText = await extractTextFromPdf(buffer);

    // 2. If OPENAI_API_KEY is configured on the server, use the OpenAI Responses API
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        const openai = new OpenAI({ apiKey });

        const prompt = `You are a specialized healthcare procurement AI extractor analyzing an official hospital or health authority RFP/tender specification document.

Analyze the extracted tender text below and output a strict JSON object with these EXACT keys:
- "title": string or null (the formal tender/contract title)
- "organization": string or null (the contracting hospital trust, health board, or procurement hub)
- "category": string or null (e.g. Medical Equipment, Diagnostic Imaging, Critical Care, Laboratory, Medical Devices, Hospital Facilities)
- "contract_value": number or null (total estimated or maximum budget as a number, or null if unstated)
- "currency": string or null ("GBP", "EUR", "USD", etc., or null if unstated)
- "deadline": string or null (submission deadline date, or null if unstated)
- "location": string or null (delivery/performance location or authority address, or null)
- "delivery_period": string or null (lead time or contract duration, or null)
- "bid_bond": string or null (bond or tender guarantee requirement, or null)
- "mandatory_requirements": array of strings (must-have pass/fail conditions)
- "technical_requirements": array of strings (clinical, hardware, or engineering specs)
- "certifications": array of strings (required standards like ISO 13485, CE MDR, DSPT, etc.)
- "experience_requirements": array of strings (past contracts, NHS reference requirements)
- "financial_requirements": array of strings (turnover ratios, insurance, audited accounts)
- "administrative_requirements": array of strings (declarations, conflict of interest, PCR 2015)
- "product_specifications": array of strings (device dimensions, power, telemetry, warranties)

CRITICAL RULES:
1. NEVER INVENT MISSING INFORMATION.
2. If any field or detail is not explicitly present or verifiable in the text, you MUST set it to null (or an empty array [] for list fields).
3. Do NOT make up values, deadlines, or requirements.

Tender text:
---
${extractedText.slice(0, 25000)}
---`;

        // Prefer OpenAI Responses API if available, else standard structured chat completion
        let resultJsonString = "";

        if (typeof (openai as any).responses?.create === "function") {
          try {
            const response = await (openai as any).responses.create({
              model: "gpt-4o-mini",
              input: prompt,
            });
            resultJsonString = response.output_text || response.choices?.[0]?.message?.content || "";
          } catch (respErr) {
            console.warn("OpenAI responses.create endpoint fallback:", respErr);
          }
        }

        if (!resultJsonString) {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a strict healthcare procurement parser. Extract structured data accurately. Never invent missing information; use null when unstated.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
          });
          resultJsonString = completion.choices[0]?.message?.content || "";
        }

        if (resultJsonString) {
          const parsed = JSON.parse(resultJsonString);
          const structuredData: ExtractedTenderData = {
            title: parsed.title ?? null,
            organization: parsed.organization ?? null,
            category: parsed.category ?? null,
            contract_value: typeof parsed.contract_value === "number" ? parsed.contract_value : null,
            currency: parsed.currency ?? null,
            deadline: parsed.deadline ?? null,
            location: parsed.location ?? null,
            delivery_period: parsed.delivery_period ?? null,
            bid_bond: parsed.bid_bond ?? null,
            mandatory_requirements: Array.isArray(parsed.mandatory_requirements) ? parsed.mandatory_requirements : [],
            technical_requirements: Array.isArray(parsed.technical_requirements) ? parsed.technical_requirements : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
            experience_requirements: Array.isArray(parsed.experience_requirements) ? parsed.experience_requirements : [],
            financial_requirements: Array.isArray(parsed.financial_requirements) ? parsed.financial_requirements : [],
            administrative_requirements: Array.isArray(parsed.administrative_requirements) ? parsed.administrative_requirements : [],
            product_specifications: Array.isArray(parsed.product_specifications) ? parsed.product_specifications : [],
            source_extraction_method: "openai_responses_api",
          };

          return new Response(JSON.stringify({ success: true, data: structuredData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (aiErr: any) {
        console.warn("OpenAI extraction error, engaging heuristic parser:", aiErr?.message);
      }
    }

    // 3. Fallback: Local intelligent heuristic extraction
    const heuristicData = extractHeuristically(extractedText, filename);
    return new Response(JSON.stringify({ success: true, data: heuristicData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API /api/extract-tender error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal extraction error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

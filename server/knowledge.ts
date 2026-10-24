export interface GroundedDoc {
  id: string;
  source: string;
  title: string;
  url: string;
  category: string;
  keywords: string[];
  content: string;
}

export const medicalKnowledge: GroundedDoc[] = [
  {
    id: "cdc-hypertension",
    source: "CDC (Centers for Disease Control and Prevention)",
    title: "High Blood Pressure (Hypertension) Basics & Prevention",
    url: "https://www.cdc.gov/bloodpressure/about.htm",
    category: "Cardiovascular",
    keywords: ["blood pressure", "hypertension", "high bp", "systolic", "diastolic", "heart"],
    content: "High blood pressure, also called hypertension, is blood pressure that is higher than normal. Blood pressure is written as two numbers: systolic pressure (pressure when the heart beats) and diastolic pressure (pressure when the heart rests between beats). Normal blood pressure is usually under 120/80 mmHg. Lifestyle factors like regular exercise (150 minutes of moderate activity per week), a low-sodium diet (under 2,300 mg/day, ideally 1,500 mg), maintaining a healthy weight, and limiting alcohol can help manage and prevent high blood pressure."
  },
  {
    id: "who-diabetes",
    source: "WHO (World Health Organization)",
    title: "Diabetes Facts, Types, and Preventive Wellness",
    url: "https://www.who.int/news-room/fact-sheets/detail/diabetes",
    category: "Endocrine",
    keywords: ["diabetes", "sugar", "insulin", "glucose", "hba1c", "blood sugar"],
    content: "Diabetes is a chronic metabolic disease characterized by elevated levels of blood glucose. Type 2 diabetes is the most common and occurs when the body becomes resistant to insulin. Prevention and management involve eating a healthy diet rich in whole grains, fiber, and lean proteins, engaging in regular physical activity, avoiding tobacco use, and monitoring blood sugar levels. Early screening is recommended for adults over 45 or those with risk factors like obesity or a family history."
  },
  {
    id: "medline-flu",
    source: "MedlinePlus (U.S. National Library of Medicine)",
    title: "Influenza (Flu) Symptom Care and Vaccination",
    url: "https://medlineplus.gov/flu.html",
    category: "Infectious Diseases",
    keywords: ["flu", "influenza", "fever", "cough", "cold", "congestion", "virus"],
    content: "Influenza (the flu) is a contagious respiratory illness caused by influenza viruses. Symptoms include fever, cough, sore throat, runny or stuffy nose, muscle aches, and fatigue. The best way to prevent the flu is by getting an annual flu vaccine, which is recommended for everyone aged 6 months and older. General home care involves resting, staying hydrated with water and warm fluids, and monitoring for warning signs like difficulty breathing."
  },
  {
    id: "cdc-exercise",
    source: "CDC (Centers for Disease Control and Prevention)",
    title: "Physical Activity Guidelines for Healthy Adults",
    url: "https://www.cdc.gov/physicalactivity/basics/adults/index.htm",
    category: "General Wellness",
    keywords: ["exercise", "physical activity", "fitness", "cardio", "strength", "walking"],
    content: "Adults need at least 150 minutes of moderate-intensity physical activity (like brisk walking) per week, along with muscle-strengthening activities on 2 or more days a week. Regular exercise reduces the risk of cardiovascular disease, Type 2 diabetes, metabolic syndrome, and several cancers while improving mental health, sleep, and overall longevity."
  },
  {
    id: "who-nutrition",
    source: "WHO (World Health Organization)",
    title: "Healthy Diet Guidelines for Adults",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    category: "Nutrition",
    keywords: ["diet", "nutrition", "eating", "sodium", "salt", "sugar", "saturated fat", "fiber"],
    content: "A healthy diet for adults includes fruit, vegetables, legumes (e.g. lentils and beans), nuts, and whole grains (e.g. oats, brown rice). Sodium intake should be restricted to less than 5g per day (equivalent to about one teaspoon of salt) to help prevent hypertension and reduce the risk of heart disease. Free sugar intake should be kept below 10% of total energy intake, and saturated fats should constitute less than 10% of total energy consumption."
  },
  {
    id: "medline-asthma",
    source: "MedlinePlus (U.S. National Library of Medicine)",
    title: "Asthma Management and Trigger Prevention",
    url: "https://medlineplus.gov/asthma.html",
    category: "Respiratory",
    keywords: ["asthma", "wheezing", "inhaler", "breathing", "allergy", "shortness of breath"],
    content: "Asthma is a chronic disease that affects the airways in your lungs. During an asthma flare-up, the airways become swollen and narrow, making it difficult to breathe. Common triggers include pollen, dust mites, pet dander, mold, cold air, and exercise. Management involves avoiding known triggers and following an Asthma Action Plan developed with a medical professional, which typically outlines daily control guidelines and rescue steps."
  },
  {
    id: "who-mental-health",
    source: "WHO (World Health Organization)",
    title: "Mental Well-being and Stress Management",
    url: "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response",
    category: "Mental Health",
    keywords: ["stress", "anxiety", "depression", "mental health", "well-being", "mindfulness"],
    content: "Mental health is a state of mental well-being that enables people to cope with the stresses of life, realize their abilities, learn well and work well, and contribute to their community. Stress management practices include physical activity, maintaining stable sleep schedules, connecting with family and friends, practicing mindfulness, and seeking professional therapy or counseling if feelings of distress persist."
  },
  {
    id: "cdc-cholesterol",
    source: "CDC (Centers for Disease Control and Prevention)",
    title: "Cholesterol Levels, Screening, and Control Guidelines",
    url: "https://www.cdc.gov/cholesterol/about.htm",
    category: "Cardiovascular",
    keywords: ["cholesterol", "ldl", "hdl", "triglycerides", "lipid", "saturated fat"],
    content: "Cholesterol is a waxy, fat-like substance made by your liver and found in certain foods. Too much LDL (low-density lipoprotein or 'bad' cholesterol) can build up in arteries, increasing heart disease risk. HDL (high-density lipoprotein or 'good' cholesterol) helps clear cholesterol from the blood. Healthy adults should get their cholesterol screened every 4 to 6 years. Managing cholesterol levels is achieved by a diet low in saturated and trans fats, rich in soluble fiber, and regular aerobic exercise."
  },
  {
    id: "nhp-india-cardio",
    source: "NHP India (National Health Portal, Govt of India)",
    title: "National Programme for Prevention of Cardiovascular Diseases & Stroke",
    url: "https://www.nhp.gov.in/disease/cardiovascular/hypertension",
    category: "Cardiovascular",
    keywords: ["india", "bp", "hypertension", "stroke", "indian diet", "salt", "preventive"],
    content: "Under India's National Health Portal, the Ministry of Health and Family Welfare (MoHFW) recommends regular blood pressure screenings at any primary health centre (PHC) or health and wellness centre. Indian dietary considerations emphasize reducing high sodium intake in pickles, papads, and traditional savory snacks, replacing them with whole grains, leafy greens, and local seasonal fruits. Regular active transport (like walking or cycling) for at least 30 minutes daily is highly encouraged."
  },
  {
    id: "mohfw-vector-diseases",
    source: "MoHFW (Ministry of Health and Family Welfare, Government of India)",
    title: "Preventative Guidelines for Dengue, Malaria, and Vector-Borne Diseases",
    url: "https://main.mohfw.gov.in/",
    category: "Infectious Diseases",
    keywords: ["dengue", "malaria", "mosquito", "fever", "vector", "monsoon", "india"],
    content: "The Ministry of Health and Family Welfare, Government of India, actively advises citizens on vector-borne disease prevention. Key practices include keeping surroundings dry, preventing any standing water in coolers, flower pots, or open containers where Aedes mosquitoes breed, using insecticide-treated mosquito nets, wearing full-sleeved clothing, and promptly visiting a government health facility or contacting the national health line 1075 if experiencing a sudden high fever with joint pain."
  }
];

export function findGroundedDocs(query: string): GroundedDoc[] {
  const normalized = query.toLowerCase();
  const matched: GroundedDoc[] = [];

  for (const doc of medicalKnowledge) {
    let score = 0;
    // Check keywords
    for (const kw of doc.keywords) {
      if (normalized.includes(kw)) {
        score += 3;
      }
    }
    // Check title/content
    if (doc.title.toLowerCase().includes(normalized)) {
      score += 2;
    }
    if (doc.content.toLowerCase().includes(normalized)) {
      score += 1;
    }

    if (score > 0) {
      matched.push(doc);
    }
  }

  // Sort by relevance (simulated RAG score)
  return matched.slice(0, 3);
}

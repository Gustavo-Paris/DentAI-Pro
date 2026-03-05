import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function parseEnvFile(content) {
  const values = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function toDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function summarizeSuggestion(suggestion) {
  return {
    tooth: suggestion.tooth,
    treatment: suggestion.treatment_indication || 'n/a',
    issue: suggestion.current_issue,
    change: suggestion.proposed_change,
  };
}

function mentionsNarrowing(text) {
  const normalized = (text || '').toLowerCase();
  if (
    normalized.includes('sem estreitar') ||
    normalized.includes('não estreitar') ||
    normalized.includes('nao estreitar') ||
    normalized.includes('sem afinar')
  ) {
    return false;
  }
  return (
    normalized.includes('estreit') ||
    normalized.includes('afinar') ||
    normalized.includes('diminu') ||
    normalized.includes('reduzir largura')
  );
}

async function unwrapFunctionError(error) {
  const details = {
    name: error?.name || 'Error',
    message: error?.message || String(error),
    status: null,
    body: null,
  };

  const context = error?.context;
  if (context) {
    details.status = context.status || null;
    try {
      details.body = await context.clone().text();
    } catch {
      details.body = null;
    }
  }

  return details;
}

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const webDir = path.join(repoRoot, 'apps/web');

  const env = parseEnvFile(await readFile(path.join(webDir, '.env'), 'utf8'));
  const e2eEnv = parseEnvFile(await readFile(path.join(webDir, '.env.e2e'), 'utf8'));

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const email = e2eEnv.E2E_USER_EMAIL;
  const password = e2eEnv.E2E_USER_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !email || !password) {
    throw new Error('Missing required env values in apps/web/.env or apps/web/.env.e2e');
  }

  const args = process.argv.slice(2);
  let topUpCredits = 0;
  const filteredArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--top-up') {
      const raw = args[i + 1];
      if (!raw) throw new Error('Missing value after --top-up');
      topUpCredits = Number.parseInt(raw, 10);
      if (!Number.isFinite(topUpCredits) || topUpCredits <= 0) {
        throw new Error(`Invalid --top-up value: ${raw}`);
      }
      i++;
      continue;
    }
    filteredArgs.push(args[i]);
  }

  const imageArg = filteredArgs[0];
  if (!imageArg) {
    throw new Error('Usage: node apps/web/scripts/validate-dsd-case.mjs [--top-up 200] <absolute-or-relative-image-path>');
  }

  const imagePath = path.isAbsolute(imageArg) ? imageArg : path.resolve(repoRoot, imageArg);
  const imageBuffer = await readFile(imagePath);
  const imageBase64 = toDataUrl(imageBuffer, getMimeType(imagePath));

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const authResult = await supabase.auth.signInWithPassword({ email, password });
  if (authResult.error) throw authResult.error;
  const userId = authResult.data.user?.id;
  if (!userId) {
    throw new Error('Authenticated user has no id');
  }

  console.log(`Authenticated as ${email}`);
  console.log(`Testing image: ${imagePath}`);

  try {
    if (topUpCredits > 0) {
      const topUpResp = await supabase.rpc('add_bonus_credits', {
        p_user_id: userId,
        p_credits: topUpCredits,
      });
      if (topUpResp.error) throw topUpResp.error;
      console.log(`Added ${topUpCredits} bonus credits to ${email}`);
    }

    const analyzeResp = await supabase.functions.invoke('analyze-dental-photo', {
      body: {
        imageBase64,
        imageType: 'intraoral',
      },
    });

    if (analyzeResp.error) throw analyzeResp.error;

    const analysis = analyzeResp.data?.analysis;
    if (!analysis) {
      throw new Error('analyze-dental-photo returned no analysis payload');
    }

    const lateralSuggestions = (analysis.detected_teeth || [])
      .filter((tooth) => tooth.tooth === '12' || tooth.tooth === '22')
      .map((tooth) => ({
        tooth: tooth.tooth,
        treatment: tooth.treatment_indication || 'n/a',
        issue: tooth.current_issue || '',
        change: tooth.proposed_change || '',
      }));

    console.log('\nAnalyze result:');
    console.log(`- primary tooth: ${analysis.primary_tooth || 'n/a'}`);
    console.log(`- detected teeth: ${(analysis.detected_teeth || []).length}`);
    console.log(`- 12/22 suggestions: ${JSON.stringify(lateralSuggestions, null, 2)}`);

    const legacyAnalysis = {
      facial_midline: analysis.facial_midline ?? 'centrada',
      dental_midline: analysis.dental_midline ?? 'alinhada',
      smile_line: analysis.smile_line ?? 'média',
      buccal_corridor: analysis.buccal_corridor ?? 'adequado',
      occlusal_plane: analysis.occlusal_plane ?? 'nivelado',
      golden_ratio_compliance: analysis.golden_ratio_compliance ?? 50,
      symmetry_score: analysis.symmetry_score ?? 50,
      suggestions: (analysis.detected_teeth || [])
        .filter((tooth) => tooth.current_issue && tooth.proposed_change)
        .map((tooth) => ({
          tooth: tooth.tooth,
          current_issue: tooth.current_issue,
          proposed_change: tooth.proposed_change,
          treatment_indication: tooth.treatment_indication,
        })),
      observations: analysis.observations || [],
      confidence: 'alta',
      lip_thickness: analysis.lip_thickness,
      overbite_suspicion: analysis.overbite_suspicion,
      smile_arc: analysis.smile_arc,
      face_shape: analysis.face_shape,
      perceived_temperament: analysis.perceived_temperament,
      recommended_tooth_shape: analysis.recommended_tooth_shape,
      visagism_notes: analysis.visagism_notes,
    };

    const dsdResp = await supabase.functions.invoke('generate-dsd', {
      body: {
        reqId: crypto.randomUUID(),
        imageBase64,
        toothShape: 'natural',
        regenerateSimulationOnly: true,
        existingAnalysis: legacyAnalysis,
        patientPreferences: {
          whiteningLevel: 'natural',
        },
      },
    });

    if (dsdResp.error) throw dsdResp.error;

    const dsdData = dsdResp.data;
    const dsdLaterals = (dsdData?.analysis?.suggestions || [])
      .filter((suggestion) => suggestion.tooth === '12' || suggestion.tooth === '22')
      .map(summarizeSuggestion);

    const narrowingStillPresent = dsdLaterals.some((suggestion) => mentionsNarrowing(suggestion.change));

    console.log('\nDSD result:');
    console.log(`- simulation generated: ${Boolean(dsdData?.simulation_url)}`);
    console.log(`- lips moved flag: ${Boolean(dsdData?.lips_moved)}`);
    console.log(`- 12/22 after safety nets: ${JSON.stringify(dsdLaterals, null, 2)}`);
    console.log(`- preserve-width rule status: ${narrowingStillPresent ? 'FAIL' : 'PASS'}`);

    const agenesisObservation = (dsdData?.analysis?.observations || []).find((obs) =>
      obs.toLowerCase().includes('agenesia dos incisivos laterais'),
    );
    console.log(`- agenesis observation added: ${Boolean(agenesisObservation)}`);
    if (agenesisObservation) {
      console.log(`- observation: ${agenesisObservation}`);
    }
  } finally {
    await supabase.auth.signOut();
  }
}

main().catch((error) => {
  Promise.resolve(unwrapFunctionError(error))
    .then((details) => {
      console.error('\nValidation failed:');
      console.error(JSON.stringify(details, null, 2));
      process.exitCode = 1;
    });
});

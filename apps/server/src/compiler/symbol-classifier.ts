import type { CatalogPartVersion } from '@descriptio-forge/shared';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { RunManager } from '../vault/run-manager.js';

export interface SymbolClassifyInput {
  functionType: string;
  groupKey: string;
  categorySlug?: string | null;
  archetypeId?: string | null;
  existingSymbolId?: string | null;
}

/**
 * Weist einer Funktionsgruppe deterministisch das praeziseste IEC-60617-Grundsymbol
 * anhand von `functionType`, `groupKey`, 165er `categorySlug` und `archetypeId` zu.
 */
export function resolveFunctionGroupSymbol(input: SymbolClassifyInput): string {
  const ft = input.functionType.toUpperCase();
  const gk = input.groupKey.toUpperCase();
  const slug = (input.categorySlug ?? '').toLowerCase();
  const arch = (input.archetypeId ?? '').toUpperCase();

  // 1) Hauptstrompole (MAIN_NO_*)
  if (gk.startsWith('MAIN_')) {
    if (slug.startsWith('mss_') || arch.startsWith('MSS_')) return 'SYM_MSS_POLE';
    if (slug.startsWith('rcbo_') || arch.includes('RCBO')) return 'SYM_RCBO_POLE';
    if (slug.startsWith('rcd_') || arch.startsWith('RCD_')) return 'SYM_RCD_POLE';
    if (slug.startsWith('afdd_') || arch.includes('AFDD')) return 'SYM_AFDD_POLE';
    if (slug === 'disc_fused' || arch.startsWith('FUSE_SWITCH')) return 'SYM_FUSE_SWITCH_POLE';
    if (slug.startsWith('disc_') || arch.startsWith('LOAD_BREAK') || arch.startsWith('CAM_SWITCH')) {
      return 'SYM_DISCONNECTOR_POLE';
    }
    if (slug.startsWith('ovl_') || arch.startsWith('OVERLOAD_')) return 'SYM_OVERLOAD_THERMAL_POLE';
    if (slug === 'schuetz_ssr' || arch.includes('SSR')) return 'SYM_SSR_POLE';
    if (slug === 'vfd_softstarter' || arch.includes('SOFTSTARTER')) return 'SYM_SOFTSTARTER_POLE';
    if (slug.startsWith('mcb_') || slug.startsWith('mccb_') || slug.startsWith('acb_') || arch.startsWith('MCB_') || arch.startsWith('MCCB_')) {
      return 'SYM_CB_POLE';
    }
    return 'SYM_SWITCH_POLE';
  }

  // 2) Spulen, Antriebe & Leuchtmelder (COIL)
  if (ft === 'COIL') {
    if (gk.startsWith('LED') || slug.startsWith('cmd_led') || slug.startsWith('cmd_tower')) {
      return 'SYM_LED_INDICATOR';
    }
    if (slug === 'cmd_buzzer') return 'SYM_ACOUSTIC_BUZZER';
    if (gk.includes('SHUNT')) return 'SYM_COIL_SHUNT';
    if (gk.includes('UV') || gk.includes('UNDERVOLTAGE')) return 'SYM_COIL_UV';
    if (gk.startsWith('MOTOR') || slug === 'acc_motor_op') return 'SYM_MOTOR_OPERATOR';
    if (slug === 'rel_safety') return 'SYM_SAFETY_RELAY_COIL';
    if (slug === 'rel_time_on') return 'SYM_COIL_TON';
    if (slug === 'rel_time_off') return 'SYM_COIL_TOFF';
    if (slug === 'rel_time_multi') return 'SYM_COIL_MULTIFUNC';
    if (slug === 'rel_impulse') return 'SYM_COIL_LATCH';
    return 'SYM_COIL_STD';
  }

  // 3) Wechsler (CHANGEOVER_CONTACT)
  if (ft === 'CHANGEOVER_CONTACT') {
    return 'SYM_CO_CONTACT';
  }

  // 4) Schliesser & Oeffner (Hilfs- und Steuerkontakte)
  if (ft === 'NO_CONTACT' || ft === 'NC_CONTACT') {
    const isNo = ft === 'NO_CONTACT';
    if (slug === 'cmd_estop') return isNo ? 'SYM_PUSHBUTTON_NO' : 'SYM_EMERGENCY_NC';
    if (slug === 'cmd_pushbutton' || slug === 'cmd_double_pb' || slug === 'cmd_mushroom') {
      return isNo ? 'SYM_PUSHBUTTON_NO' : 'SYM_PUSHBUTTON_NC';
    }
    if (slug === 'cmd_selector' || slug === 'cmd_cam_switch') {
      return isNo ? 'SYM_SELECTOR_NO' : 'SYM_NC_CONTACT';
    }
    if (slug === 'cmd_key_switch') return isNo ? 'SYM_KEY_SWITCH_NO' : 'SYM_NC_CONTACT';
    if (slug.startsWith('pos_')) return isNo ? 'SYM_LIMIT_NO' : 'SYM_LIMIT_NC';
    if (slug === 'proc_pressure') return isNo ? 'SYM_PRESSURE_NO' : 'SYM_PRESSURE_NC';
    if (slug === 'proc_temp') return isNo ? 'SYM_TEMP_NO' : 'SYM_TEMP_NC';
    if (slug === 'proc_level_flow') return isNo ? 'SYM_FLOAT_NO' : 'SYM_NC_CONTACT';
    if (slug.startsWith('ovl_') || arch.startsWith('OVERLOAD_')) {
      return isNo ? 'SYM_NO_FAULT_SIGNAL' : 'SYM_NC_THERMAL';
    }
    if (slug === 'rel_time_on') return isNo ? 'SYM_NO_DELAY_ON' : 'SYM_NC_DELAY_ON';
    if (slug === 'rel_time_off') return isNo ? 'SYM_NO_DELAY_OFF' : 'SYM_NC_CONTACT';
    return isNo ? 'SYM_NO_CONTACT' : 'SYM_NC_CONTACT';
  }

  // 5) Klemmen, Stromversorgungen, SPS, Sensoren & Schutzorgane (TERMINAL_PASS / POWER_OUT)
  if (gk.startsWith('PE') || slug === 'term_pe') return 'SYM_TERMINAL_PE';
  if (gk === 'N' || gk.startsWith('N_') || slug === 'term_n_disc') return 'SYM_N_DISCONNECT_TERMINAL';
  if (gk.startsWith('DISCONNECT') || slug === 'term_disconnect') return 'SYM_TERMINAL_DISCONNECT';
  if (gk.startsWith('DIODE')) return 'SYM_DIODE_TERMINAL';
  if (gk.startsWith('FUSE') && slug === 'term_fuse') return 'SYM_FUSE_TERMINAL';
  if (gk.startsWith('FUSE') || slug.startsWith('fuse_')) return 'SYM_FUSE_POLE';
  if (gk.startsWith('SUPP') || slug.startsWith('spd_')) return 'SYM_SPD_POLE';
  if (gk.startsWith('PLUG') || slug.startsWith('plug_')) return 'SYM_PLUG_PIN';
  if (gk.startsWith('BUS') || slug.startsWith('bus_')) return 'SYM_BUSBAR_PASS';
  if (gk.startsWith('PRIMARY') || gk.startsWith('SECONDARY') || slug.startsWith('trafo_')) {
    return 'SYM_TRANSFORMER_WINDING';
  }
  if (gk.startsWith('INPUT_MAINS')) return 'SYM_PSU_INPUT';
  if (gk.startsWith('OUTPUT_DC') || gk.startsWith('CHANNELS')) {
    return slug === 'psu_ups_buffer' ? 'SYM_UPS_BLOCK' : 'SYM_PSU_OUTPUT';
  }
  if (gk.startsWith('MAINS_IN') || gk.startsWith('MOTOR_OUT')) {
    return slug === 'vfd_choke_filter' ? 'SYM_CHOKE_REACTOR' : 'SYM_VFD_POWER';
  }
  if (gk.startsWith('SENSOR_IO') || gk.startsWith('SENSOR') || slug.startsWith('prox_')) {
    return 'SYM_SENSOR_PROXIMITY';
  }
  if (gk.startsWith('DI_GROUP') || slug === 'plc_di') return 'SYM_PLC_DI';
  if (gk.startsWith('DO_GROUP') || slug === 'plc_do') return 'SYM_PLC_DO';
  if (gk.startsWith('AI_GROUP') || slug === 'plc_ai') return 'SYM_PLC_AI';
  if (gk.startsWith('AO_GROUP') || slug === 'plc_ao') return 'SYM_PLC_AO';
  if (slug === 'meas_ct') return 'SYM_CURRENT_TRANSFORMER';
  if (slug === 'meas_energy') return 'SYM_ENERGY_METER';
  if (slug === 'meas_panel') return 'SYM_AMMETER';
  if (slug === 'cab_climate') return 'SYM_HEATER_RESISTOR';

  return input.existingSymbolId || 'SYM_TERMINAL_PASS';
}

/**
 * Weist allen Funktionsgruppen eines Runs (`compiled_function_groups` + `compiled_part_json`)
 * in einer einzigen SQLite-Transaktion die exakte `symbolDefinitionId` zu.
 */
export function assignSymbolsToRun(
  runId: string,
  runManager: RunManager,
  _globalDb: GlobalVaultDb,
): { runId: string; updatedParts: number; updatedGroups: number; distribution: Record<string, number> } {
  const runDb = runManager.getRunDb(runId);
  const parts = runDb
    .prepare(
      `SELECT id, archetype_id, compiled_part_json
       FROM staged_parts
       WHERE pipeline_status = 'VALIDATED' AND compiled_part_json IS NOT NULL`,
    )
    .all() as { id: string; archetype_id: string | null; compiled_part_json: string }[];

  const updatePart = runDb.prepare(`UPDATE staged_parts SET compiled_part_json = @json WHERE id = @id`);
  const updateFg = runDb.prepare(
    `UPDATE compiled_function_groups
     SET symbol_definition_id = @symId
     WHERE id = @fgId`,
  );

  const distribution: Record<string, number> = {};
  let updatedGroups = 0;

  const tx = runDb.transaction(() => {
    for (const row of parts) {
      const compiled = JSON.parse(row.compiled_part_json) as CatalogPartVersion;
      const slug = compiled.categorySlug ?? null;
      for (const fg of compiled.functionGroups) {
        const symId = resolveFunctionGroupSymbol({
          functionType: fg.functionType,
          groupKey: fg.groupKey,
          categorySlug: slug,
          archetypeId: row.archetype_id ?? compiled.archetypeId,
          existingSymbolId: fg.symbolDefinitionId,
        });
        fg.symbolDefinitionId = symId;
        updateFg.run({ symId, fgId: fg.id });
        distribution[symId] = (distribution[symId] ?? 0) + 1;
        updatedGroups += 1;
      }
      updatePart.run({ id: row.id, json: JSON.stringify(compiled) });
    }
  });
  tx();

  return { runId, updatedParts: parts.length, updatedGroups, distribution };
}

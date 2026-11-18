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

const hasSlugToken = (slug: string, ...tokens: string[]): boolean =>
  tokens.some((tok) => slug.includes(tok));

/**
 * Weist einer Funktionsgruppe deterministisch das praeziseste IEC-60617-Grundsymbol
 * anhand von `functionType`, `groupKey`, 4-stufigem `categorySlug` und `archetypeId` zu.
 */
export function resolveFunctionGroupSymbol(input: SymbolClassifyInput): string {
  const ft = input.functionType.toUpperCase();
  const gk = input.groupKey.toUpperCase();
  const slug = (input.categorySlug ?? '').toLowerCase();
  const arch = (input.archetypeId ?? '').toUpperCase();

  // 1) Hauptstrompole (MAIN_NO_*)
  if (gk.startsWith('MAIN_')) {
    if (hasSlugToken(slug, 'mss_') || arch.startsWith('MSS_')) return 'SYM_MSS_POLE';
    if (hasSlugToken(slug, 'rcbo_') || hasSlugToken(slug, '.rcbo.') || arch.includes('RCBO')) {
      return 'SYM_RCBO_POLE';
    }
    if (hasSlugToken(slug, 'rcd_') || hasSlugToken(slug, '.rcd.') || arch.startsWith('RCD_')) {
      return 'SYM_RCD_POLE';
    }
    if (hasSlugToken(slug, 'afdd_') || arch.includes('AFDD')) return 'SYM_AFDD_POLE';
    if (slug === 'disc_fused' || arch.startsWith('FUSE_SWITCH')) return 'SYM_FUSE_SWITCH_POLE';
    if (
      hasSlugToken(slug, 'disc_', 'lasttrennschalter', 'haupt_not_aus') ||
      arch.startsWith('LOAD_BREAK') ||
      arch.startsWith('MAIN_SWITCH') ||
      arch.startsWith('CAM_SWITCH')
    ) {
      return 'SYM_DISCONNECTOR_POLE';
    }
    if (hasSlugToken(slug, 'ovl_', 'ueberlastrelais') || arch.startsWith('OVERLOAD_')) {
      return 'SYM_OVERLOAD_THERMAL_POLE';
    }
    if (slug === 'schuetz_ssr' || arch.includes('SSR')) return 'SYM_SSR_POLE';
    if (hasSlugToken(slug, 'softstarter', 'sanftstarter') || arch.includes('SOFTSTARTER') || arch.startsWith('SOFT_STARTER')) {
      return 'SYM_SOFTSTARTER_POLE';
    }
    if (hasSlugToken(slug, 'schmelzeinsaetze', 'sicherungshalter') || arch.startsWith('FUSE_')) {
      return 'SYM_FUSE_POLE';
    }
    if (hasSlugToken(slug, 'ueberspannungsableiter', 'spd_') || arch.startsWith('SPD_')) {
      return 'SYM_SPD_POLE';
    }
    if (hasSlugToken(slug, 'druckwaechter', 'proc_pressure') || arch.startsWith('PRESSURE_SWITCH')) {
      return 'SYM_PRESSURE_NO';
    }
    if (
      hasSlugToken(slug, 'mcb_', '.mcb.', 'mccb_', '.mccb.', 'acb_') ||
      arch.startsWith('MCB_') ||
      arch.startsWith('MCCB_')
    ) {
      return 'SYM_CB_POLE';
    }
    return 'SYM_SWITCH_POLE';
  }

  // 2) Spulen, Antriebe & Leuchtmelder (COIL)
  if (ft === 'COIL') {
    if (gk.startsWith('LED') || hasSlugToken(slug, 'cmd_led', 'cmd_tower', 'leuchtmelder')) {
      return 'SYM_LED_INDICATOR';
    }
    if (hasSlugToken(slug, 'cmd_buzzer', 'buzzer', 'hupe')) return 'SYM_ACOUSTIC_BUZZER';
    if (gk.includes('SHUNT') || hasSlugToken(slug, 'arbeitsstromausloeser') || arch.includes('SHUNT')) {
      return 'SYM_COIL_SHUNT';
    }
    if (gk.includes('UV') || gk.includes('UNDERVOLTAGE') || hasSlugToken(slug, 'unterspannungsausloeser') || arch.includes('_UV')) {
      return 'SYM_COIL_UV';
    }
    if (gk.startsWith('MOTOR') || hasSlugToken(slug, 'acc_motor_op', 'motorantrieb') || arch.startsWith('MOTOR_OPERATOR')) {
      return 'SYM_MOTOR_OPERATOR';
    }
    if (hasSlugToken(slug, 'sicherheitsrelais', 'rel_safety') || arch.startsWith('SAFETY_RELAY')) {
      return 'SYM_SAFETY_RELAY_COIL';
    }
    if (hasSlugToken(slug, 'zeitrelais', 'rel_time_multi') || arch.startsWith('TIME_RELAY')) {
      return 'SYM_COIL_MULTIFUNC';
    }
    if (slug === 'rel_time_on') return 'SYM_COIL_TON';
    if (slug === 'rel_time_off') return 'SYM_COIL_TOFF';
    if (slug === 'rel_impulse') return 'SYM_COIL_LATCH';
    if (gk.includes('SOLENOID') || hasSlugToken(slug, 'magnetventil')) return 'SYM_SOLENOID_VALVE';
    if (gk === 'SUPPLY_24VDC') {
      if (hasSlugToken(slug, 'touchpanel', 'hmi')) return 'SYM_LED_INDICATOR';
      if (hasSlugToken(slug, 'sps_plc', 'steuerrelais', 'kommunikation_feldbus')) return 'SYM_PLC_IO_CHANNEL';
    }
    return 'SYM_COIL_STD';
  }

  // 3) Wechsler (CHANGEOVER_CONTACT)
  if (ft === 'CHANGEOVER_CONTACT') {
    return 'SYM_CO_CONTACT';
  }

  // 4) Schliesser & Oeffner (Hilfs- und Steuerkontakte)
  if (ft === 'NO_CONTACT' || ft === 'NC_CONTACT') {
    const isNo = ft === 'NO_CONTACT';
    if (hasSlugToken(slug, 'cmd_estop', 'not_aus', 'not_halt')) {
      return isNo ? 'SYM_PUSHBUTTON_NO' : 'SYM_EMERGENCY_NC';
    }
    if (hasSlugToken(slug, 'schluesselschalter', 'cmd_key_switch')) {
      return isNo ? 'SYM_KEY_SWITCH_NO' : 'SYM_NC_CONTACT';
    }
    if (hasSlugToken(slug, 'wahlschalter', 'nockenschalter', 'cmd_selector', 'cmd_cam_switch')) {
      return isNo ? 'SYM_SELECTOR_NO' : 'SYM_NC_CONTACT';
    }
    if (hasSlugToken(slug, 'drucktaster', 'taster_frontelemente', 'cmd_pushbutton', 'cmd_double_pb', 'cmd_mushroom') || arch.startsWith('PILOT_')) {
      return isNo ? 'SYM_PUSHBUTTON_NO' : 'SYM_PUSHBUTTON_NC';
    }
    if (hasSlugToken(slug, 'pos_', 'positionsschalter', 'endschalter') || arch.startsWith('POSITION_SWITCH')) {
      return isNo ? 'SYM_LIMIT_NO' : 'SYM_LIMIT_NC';
    }
    if (hasSlugToken(slug, 'proc_pressure', 'druckwaechter') || arch.startsWith('PRESSURE_SWITCH')) {
      return isNo ? 'SYM_PRESSURE_NO' : 'SYM_PRESSURE_NC';
    }
    if (hasSlugToken(slug, 'proc_temp', 'temperatur', 'thermostat')) {
      return isNo ? 'SYM_TEMP_NO' : 'SYM_TEMP_NC';
    }
    if (hasSlugToken(slug, 'proc_level_flow', 'fuellstand', 'schwimmer')) {
      return isNo ? 'SYM_FLOAT_NO' : 'SYM_NC_CONTACT';
    }
    if (hasSlugToken(slug, 'ovl_', 'ueberlastrelais') || arch.startsWith('OVERLOAD_')) {
      return isNo ? 'SYM_NO_FAULT_SIGNAL' : 'SYM_NC_THERMAL';
    }
    if (hasSlugToken(slug, 'rel_time_on', 'zeitrelais') || arch.startsWith('TIME_RELAY')) {
      return isNo ? 'SYM_NO_DELAY_ON' : 'SYM_NC_DELAY_ON';
    }
    if (slug === 'rel_time_off') return isNo ? 'SYM_NO_DELAY_OFF' : 'SYM_NC_CONTACT';
    return isNo ? 'SYM_NO_CONTACT' : 'SYM_NC_CONTACT';
  }

  // 5) Klemmen, Stromversorgungen, SPS, Sensoren & Schutzorgane (TERMINAL_PASS / POWER_OUT)
  if (gk.startsWith('PE') || hasSlugToken(slug, 'term_pe', 'schutzleiterklemmen_pe') || arch.startsWith('TERMINAL_PE')) {
    return 'SYM_TERMINAL_PE';
  }
  if (gk === 'N' || gk.startsWith('N_') || hasSlugToken(slug, 'term_n_disc', 'neutralleiter') || arch.startsWith('TERMINAL_N_')) {
    return 'SYM_N_DISCONNECT_TERMINAL';
  }
  if (gk.startsWith('DISCONNECT') || hasSlugToken(slug, 'term_disconnect', 'trennklemme') || arch.startsWith('TERMINAL_DISCONNECT')) {
    return 'SYM_TERMINAL_DISCONNECT';
  }
  if (gk.startsWith('DIODE') || arch.startsWith('TERMINAL_DIODE')) return 'SYM_DIODE_TERMINAL';
  if (
    hasSlugToken(slug, 'sicherungsklemme', 'term_fuse') ||
    arch.startsWith('TERMINAL_FUSE') ||
    (gk.startsWith('FUSE') && hasSlugToken(slug, 'reihenklemmen'))
  ) {
    return 'SYM_FUSE_TERMINAL';
  }
  if (gk.startsWith('FUSE') || hasSlugToken(slug, 'fuse_', 'schmelzeinsaetze', 'sicherungshalter') || arch.startsWith('FUSE_')) {
    return 'SYM_FUSE_POLE';
  }
  if (hasSlugToken(slug, 'elektronische_schutzschalter_24v') || arch.startsWith('CB_ELECTRONIC')) {
    return 'SYM_CB_POLE';
  }
  if (hasSlugToken(slug, 'schutzbeschaltung_varistor') || arch.startsWith('SURGE_SUPPRESSOR')) {
    return 'SYM_CAPACITOR_POWER';
  }
  if (gk.startsWith('SUPP') || hasSlugToken(slug, 'spd_', 'ueberspannungsableiter') || arch.startsWith('SPD_')) {
    return 'SYM_SPD_POLE';
  }
  if (gk.startsWith('PLUG') || hasSlugToken(slug, 'plug_', 'steckverbinder') || arch.startsWith('PLUG_')) {
    return 'SYM_PLUG_PIN';
  }
  if (gk.startsWith('BUS') || hasSlugToken(slug, 'bus_', 'sammelschienen', 'phasenschienen', 'einspeiseklemmen') || arch.startsWith('BUSBAR_')) {
    return 'SYM_BUSBAR_PASS';
  }
  if (gk.startsWith('PRIMARY') || gk.startsWith('SECONDARY') || hasSlugToken(slug, 'trafo_', 'transformatoren') || arch.startsWith('TRANSFORMER_')) {
    return 'SYM_TRANSFORMER_WINDING';
  }
  if (gk.startsWith('INPUT_MAINS') || (hasSlugToken(slug, 'schaltnetzteile') && ft === 'TERMINAL_PASS')) {
    return 'SYM_PSU_INPUT';
  }
  if (gk.startsWith('OUTPUT_DC') || gk.startsWith('CHANNELS')) {
    return hasSlugToken(slug, 'ups', 'usv') ? 'SYM_UPS_BLOCK' : 'SYM_PSU_OUTPUT';
  }
  if (gk.startsWith('MAINS_IN') || gk.startsWith('MOTOR_OUT')) {
    return hasSlugToken(slug, 'choke', 'drossel') ? 'SYM_CHOKE_REACTOR' : 'SYM_VFD_POWER';
  }
  if (gk.startsWith('SENSOR_IO') || gk.startsWith('SENSOR') || hasSlugToken(slug, 'prox_', 'induktive_sensoren', 'kapazitive_sensoren', 'optische_sensoren')) {
    return 'SYM_SENSOR_PROXIMITY';
  }
  if (gk.startsWith('DI_GROUP') || hasSlugToken(slug, 'plc_di', 'digitale_eingaenge_di')) return 'SYM_PLC_DI';
  if (gk.startsWith('DO_GROUP') || hasSlugToken(slug, 'plc_do', 'digitale_ausgaenge_do')) return 'SYM_PLC_DO';
  if (gk.startsWith('AI_GROUP') || hasSlugToken(slug, 'plc_ai', 'analoge_ea_ai_ao')) return 'SYM_PLC_AI';
  if (gk.startsWith('AO_GROUP') || slug === 'plc_ao') return 'SYM_PLC_AO';
  if (hasSlugToken(slug, 'sps_plc', 'kommunikation_feldbus', 'touchpanels')) return 'SYM_PLC_IO_CHANNEL';
  if (hasSlugToken(slug, 'meas_ct', 'stromwandler')) return 'SYM_CURRENT_TRANSFORMER';
  if (hasSlugToken(slug, 'meas_energy', 'zaehler')) return 'SYM_ENERGY_METER';
  if (hasSlugToken(slug, 'meas_panel', 'amperemeter')) return 'SYM_AMMETER';
  if (hasSlugToken(slug, 'cab_climate', 'schaltschrankheizung')) return 'SYM_HEATER_RESISTOR';

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

import * as XLSX from 'xlsx'
import { getWeightForAgeZScore } from './whoWeightForAge'
import { getLengthForAgeZScore } from './whoHeightForAge'
import { getWeightForLengthHeightZScore } from './whoWeightForLengthHeight'

// OPT Plus status codes (per DOH OPT Plus workbook conventions):
//   WFA: N (normal), UW (< -2 SD), SUW (< -3 SD), OW (> +2 SD)
//   HFA: N (normal), St (< -2 SD), SSt (< -3 SD), T (> +2 SD)
//   WFH: N (-2..+2 SD), MW (< -2 SD), SW (< -3 SD), OW (+2..+3 SD), Ob (> +3 SD)
export function getWfaStatusCode(record) {
  const z = getWeightForAgeZScore(record.weight, record.ageMonths, record.sex)
  if (z === null) return ''
  if (z < -3) return 'SUW'
  if (z < -2) return 'UW'
  if (z > 2) return 'OW'
  return 'N'
}

export function getHfaStatusCode(record) {
  const z = getLengthForAgeZScore(record.height, record.ageMonths, record.sex)
  if (z === null) return ''
  if (z < -3) return 'SSt'
  if (z < -2) return 'St'
  if (z > 2) return 'T'
  return 'N'
}

export function getWfhStatusCode(record) {
  const z = getWeightForLengthHeightZScore(record.weight, record.height, record.ageMonths, record.sex)
  if (z === null) return ''
  if (z < -3) return 'SW'
  if (z < -2) return 'MW'
  if (z <= 2) return 'N'
  if (z <= 3) return 'OW'
  return 'Ob'
}

const AGE_GROUPS = [
  ['0-5 months', 0, 5],
  ['6-11 months', 6, 11],
  ['12-23 months', 12, 23],
  ['24-35 months', 24, 35],
  ['36-47 months', 36, 47],
  ['48-59 months', 48, 59],
]

const sexCode = (sex) => (sex === 'Male' ? 'M' : sex === 'Female' ? 'F' : '')

const fmtDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

function tallyRecords(records, statusFn, categories) {
  const rows = AGE_GROUPS.map(([label, min, max]) => ({
    label,
    min,
    max,
    counts: Object.fromEntries(categories.flatMap((c) => [[`${c}_b`, 0], [`${c}_g`, 0]])),
    boys: 0,
    girls: 0,
  }))
  for (const r of records) {
    const age = parseInt(r.ageMonths, 10)
    const code = statusFn(r)
    const sc = sexCode(r.sex)
    if (!code || !sc || isNaN(age)) continue
    const group = rows.find((g) => age >= g.min && age <= g.max)
    if (!group) continue
    const key = `${code}_${sc === 'M' ? 'b' : 'g'}`
    if (key in group.counts) group.counts[key]++
    if (sc === 'M') group.boys++
    else group.girls++
  }
  return rows
}

function pushTallyBlock(aoa, title, headers, categories, tallies) {
  aoa.push([], [title], ['Age Group', ...headers])
  let totB = 0
  let totG = 0
  for (const { label, counts, boys, girls } of tallies) {
    totB += boys
    totG += girls
    aoa.push([label, ...categories.map((c) => counts[`${c}_b`]), ...categories.map((c) => counts[`${c}_g`]), boys, girls, boys + girls])
  }
  aoa.push(['TOTAL', ...categories.map(() => ''), '', '', totB, totG, totB + totG])
}

function buildTallyAoA(barangay, records) {
  const wfaCats = ['N', 'UW', 'SUW', 'OW']
  const hfaCats = ['N', 'St', 'SSt', 'T']
  const wflCats = ['N', 'MW', 'SW', 'OW', 'Ob']

  const aoa = [
    ['Republic of the Philippines'],
    ['Department of Health'],
    ['OPT Plus Form 1A. Barangay Tally and Summary of Preschool Children Aged 0-59 Months'],
    [`Barangay: ${barangay || ''}    Municipality: UBAY    Province: BOHOL    Generated: ${new Date().toISOString().split('T')[0]}`],
  ]

  const mkHeaders = (cats) => cats.flatMap((c) => [`Boys (${c})`, `Girls (${c})`])
  const wfa = tallyRecords(records, getWfaStatusCode, wfaCats)
  pushTallyBlock(aoa, 'WEIGHT-FOR-AGE STATUS', [...mkHeaders(wfaCats), 'Total Boys', 'Total Girls', 'Total'], wfaCats, wfa)

  const hfa = tallyRecords(records, getHfaStatusCode, hfaCats)
  pushTallyBlock(aoa, 'LENGTH/HEIGHT-FOR-AGE STATUS', [...mkHeaders(hfaCats), 'Total Boys', 'Total Girls', 'Total'], hfaCats, hfa)

  const wfl = tallyRecords(records, getWfhStatusCode, wflCats)
  pushTallyBlock(aoa, 'WEIGHT FOR LENGTH/HEIGHT STATUS', [...mkHeaders(wflCats), 'Total Boys', 'Total Girls', 'Total'], wflCats, wfl)

  return aoa
}

// Columns exactly as OPT Plus Form 1B:
//   Child No. | Purok | Name of Mother or Caregiver | Child's Full Name |
//   Sex | Age in Months | WFA_Stat | HFA_Stat | WFH_Stat
function buildRosterAoA(barangay, records) {
  const aoa = [
    ['Republic of the Philippines'],
    ['Department of Health'],
    ['OPT Plus Form 1B. Barangay Child Master List'],
    [`Barangay: ${barangay || ''}    Date Generated: ${new Date().toISOString().split('T')[0]}`],
    [],
    ['Child No.', 'Purok', 'Name of Mother or Caregiver', "Child's Full Name", 'Sex', 'Age in Months', 'WFA_Stat', 'HFA_Stat', 'WFH_Stat'],
  ]
  records.forEach((r, i) => {
    aoa.push([
      i + 1,
      r.purok != null ? `PUROK ${r.purok}` : '',
      r.motherOrCaregiver || '',
      r.fullName || '',
      sexCode(r.sex),
      r.ageMonths ?? '',
      getWfaStatusCode(r),
      getHfaStatusCode(r),
      getWfhStatusCode(r),
    ])
  })
  return aoa
}

// Clean & Update style sheet: per-child raw measurements
function buildDetailsAoA(barangay, records) {
  const aoa = [
    ['OPT Plus - Clean and Update Data'],
    [`Barangay: ${barangay || ''}    Date Generated: ${new Date().toISOString().split('T')[0]}`],
    [],
    ['Child Seq.', 'Purok', 'Name of Mother or Caregiver', "Child's Full Name", 'Sex', 'Age in Months', 'Date of Birth', 'Date Last Measured', 'WEIGHT (kg)', 'HEIGHT (cm)', 'WFA_Stat', 'HFA_Stat', 'WFH_Stat'],
  ]
  records.forEach((r, i) => {
    aoa.push([
      i + 1,
      r.purok != null ? `PUROK ${r.purok}` : '',
      r.motherOrCaregiver || '',
      r.fullName || '',
      sexCode(r.sex),
      r.ageMonths ?? '',
      fmtDate(r.birthdate),
      fmtDate(r.recordedDate),
      r.weight ?? '',
      r.height ?? '',
      getWfaStatusCode(r),
      getHfaStatusCode(r),
      getWfhStatusCode(r),
    ])
  })
  return aoa
}

export function exportOptPlusExcel({ barangay, records }) {
  const wb = XLSX.utils.book_new()

  const tallyWs = XLSX.utils.aoa_to_sheet(buildTallyAoA(barangay, records))
  tallyWs['!cols'] = new Array(16).fill({ wch: 11 })
  tallyWs['!cols'][0] = { wch: 14 }
  XLSX.utils.book_append_sheet(wb, tallyWs, 'OPT_Form1A')

  const rosterWs = XLSX.utils.aoa_to_sheet(buildRosterAoA(barangay, records))
  rosterWs['!cols'] = [
    { wch: 9 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 6 },
    { wch: 13 }, { wch: 9 }, { wch: 9 }, { wch: 9 },
  ]
  XLSX.utils.book_append_sheet(wb, rosterWs, 'OPT_Form1B')

  const detailsWs = XLSX.utils.aoa_to_sheet(buildDetailsAoA(barangay, records))
  detailsWs['!cols'] = [
    { wch: 9 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 6 }, { wch: 13 },
    { wch: 13 }, { wch: 17 }, { wch: 12 }, { wch: 12 }, { wch: 9 }, { wch: 9 }, { wch: 9 },
  ]
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Clean_Update')

  const safeName = (barangay || 'Barangay').replace(/[^A-Za-z0-9_-]+/g, '_')
  XLSX.writeFile(wb, `OPT_Plus_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

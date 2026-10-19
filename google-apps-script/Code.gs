/**
 * Google Apps Script (Code.gs)
 * Post-it Todo List CRUD API
 * 
 * 구글 시트 정확한 7개 컬럼 순서 (H열 id 없이 A~G열만 사용):
 * A: timestamp | B: datetime | C: category | D: content | E: color | F: state | G: order
 * 
 * 고유 식별자(id):
 * 각 메모의 불변 식별자는 최초 생성 시각인 datetime(B열)을 고유 키로 활용합니다.
 */

const SPREADSHEET_ID = '1GoaPsj8ysuM__x9oHD_GlAy4kg32cvkY-VwXk4AhcN0';
const SHEET_NAME = 'Sheet1';

function getTargetSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

/**
 * 1. GET: 전체 조회 (A~G열 7개 컬럼만 조회)
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;
    if (action === 'delete') {
      const id = e.parameter.id;
      return handleDelete(id);
    }

    const sheet = getTargetSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse({ success: true, notes: [] });
    }

    const notes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const timestamp = String(row[0] || '');
      const datetime = String(row[1] || '');
      const category = String(row[2] || '할 일');
      const content = String(row[3] || '');
      const color = Number(row[4]) || 0;
      const state = String(row[5] || '');
      const order = Number(row[6]) || 0;

      if (!content && !datetime) continue; // 빈 행 스킵

      // H열 없이 datetime을 고유 id로 사용 (없으면 인덱스 기반)
      const id = datetime || `note-${timestamp}-${i}`;

      notes.push({
        id: id,
        timestamp: timestamp,
        datetime: datetime,
        category: category,
        content: content,
        color: color,
        state: state,
        order: order,
      });
    }

    notes.sort((a, b) => a.order - b.order);
    return createJsonResponse({ success: true, notes: notes });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * 2. POST: 추가, 수정, 삭제, 일괄 저장 (정확히 7개 열만 기록)
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action;
    const sheet = getTargetSheet();

    switch (action) {
      case 'create': {
        const note = body.note;
        if (!note) throw new Error('Note is required.');
        // A: timestamp, B: datetime, C: category, D: content, E: color, F: state, G: order
        sheet.appendRow([
          note.timestamp,
          note.datetime,
          note.category,
          note.content,
          note.color,
          note.state,
          note.order
        ]);
        return createJsonResponse({ success: true, message: 'Note created.' });
      }

      case 'update': {
        const note = body.note;
        if (!note) throw new Error('Note is required.');
        const data = sheet.getDataRange().getValues();
        let targetRowIndex = -1;

        // B열(datetime) 또는 id로 해당 행 검색
        for (let i = 1; i < data.length; i++) {
          const rowDatetime = String(data[i][1] || '');
          if (rowDatetime === String(note.datetime) || rowDatetime === String(note.id)) {
            targetRowIndex = i + 1;
            break;
          }
        }

        if (targetRowIndex === -1) {
          throw new Error('Note not found for datetime: ' + (note.datetime || note.id));
        }

        // A~G열(7개)만 업데이트
        sheet.getRange(targetRowIndex, 1, 1, 7).setValues([[
          note.timestamp,
          note.datetime,
          note.category,
          note.content,
          note.color,
          note.state,
          note.order
        ]]);
        return createJsonResponse({ success: true, message: 'Note updated.' });
      }

      case 'delete': {
        return handleDelete(body.id);
      }

      case 'saveAll': {
        const notes = body.notes || [];
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }

        if (notes.length > 0) {
          const rows = notes.map((n) => [
            n.timestamp,
            n.datetime,
            n.category,
            n.content,
            n.color,
            n.state,
            n.order
          ]);
          sheet.getRange(2, 1, rows.length, 7).setValues(rows);
        }
        return createJsonResponse({ success: true, message: 'All notes saved.' });
      }

      default:
        throw new Error('Unsupported action: ' + action);
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function handleDelete(targetId) {
  if (!targetId) throw new Error('ID (or datetime) is required.');
  const sheet = getTargetSheet();
  const data = sheet.getDataRange().getValues();
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    const rowDatetime = String(data[i][1] || '');
    if (rowDatetime === String(targetId)) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex !== -1) {
    sheet.deleteRow(targetRowIndex);
  }
  return createJsonResponse({ success: true, message: 'Note deleted.' });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

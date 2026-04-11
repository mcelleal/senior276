
import { Patrol, LogEntry } from './types';

export interface SyncData {
  patrols: Patrol[];
  logs: LogEntry[];
  lastUpdated: number;
  authToken?: string;
}

export const syncService = {
  async pushData(url: string, data: { logs: LogEntry[], authToken?: string }): Promise<SyncData | null> {
    if (!url) return null;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scout-Auth': data.authToken || '',
        },
        body: JSON.stringify({ logs: data.logs }),
      });

      if (response.status === 403) throw new Error("AUTH_FAILED");
      if (!response.ok) throw new Error(`SERVER_ERROR_${response.status}`);
      
      const result = await response.json();
      if (result && result.error) throw new Error(result.error);
      
      return result as SyncData;
    } catch (error) {
      console.error('Erro de Rede (Push):', error);
      throw error;
    }
  },

  async deleteLogs(url: string, data: { logIds?: string[], groupIds?: string[], authToken?: string }): Promise<SyncData | null> {
    if (!url) return null;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scout-Auth': data.authToken || '',
        },
        body: JSON.stringify({ 
          action: 'delete_logs',
          logIds: data.logIds || [],
          groupIds: data.groupIds || []
        }),
      });

      if (response.status === 403) throw new Error("AUTH_FAILED");
      if (!response.ok) throw new Error(`SERVER_ERROR_${response.status}`);
      
      const result = await response.json();
      if (result && result.error) throw new Error(result.error);
      
      return result as SyncData;
    } catch (error) {
      console.error('Erro de Rede (Delete):', error);
      throw error;
    }
  },

  async pullData(url: string, authToken: string): Promise<SyncData | 'EMPTY' | null> {
    if (!url) return null;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Scout-Auth': authToken,
        },
      });

      if (response.status === 403) throw new Error("AUTH_FAILED");
      
      if (response.ok) {
        const data = await response.json();
        
        // Se retornar erro estruturado do PHP
        if (data && data.error) throw new Error(data.error);
        
        // Caso retorne "Sem dados" (nosso formato de resposta do PHP)
        if (data && data.message === "Sem dados") return 'EMPTY';
        
        // Se não tiver a estrutura esperada mas for um JSON válido
        if (!data || !data.patrols) return 'EMPTY';
        
        return data as SyncData;
      }
      
      throw new Error(`SERVER_ERROR_${response.status}`);
    } catch (error) {
      console.error('Erro de Rede (Pull):', error);
      throw error;
    }
  },

  generatePHPScript(dbHost: string, dbUser: string, dbPass: string, dbName: string, authToken: string): string {
    return `<?php
/**
 * BRIDGE SCOUT RPG - Versão Normalizada
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Scout-Auth, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = '${dbHost || 'localhost'}';
$user = '${dbUser}';
$pass = '${dbPass}';
$db   = '${dbName}';
$expectedToken = '${authToken}';

$receivedToken = '';
if (isset($_SERVER['HTTP_X_SCOUT_AUTH'])) {
    $receivedToken = $_SERVER['HTTP_X_SCOUT_AUTH'];
} elseif (function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['X-Scout-Auth'])) $receivedToken = $headers['X-Scout-Auth'];
}

if (empty($receivedToken) || $receivedToken !== $expectedToken) {
    http_response_code(403);
    echo json_encode(["error" => "AUTH_FAILED"]);
    exit;
}

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erro MySQL", "details" => $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

$conn->query("
CREATE TABLE IF NOT EXISTS patrols (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    troop VARCHAR(100) NOT NULL,
    xp_prontidao INT DEFAULT 0,
    xp_proficiencia INT DEFAULT 0,
    xp_fraternidade INT DEFAULT 0
)");

$conn->query("
CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    patrol_name VARCHAR(50) NOT NULL,
    xp_value INT NOT NULL,
    attribute VARCHAR(50) NOT NULL,
    description TEXT,
    comment TEXT,
    group_id VARCHAR(50)
)");

$result = $conn->query("SELECT COUNT(*) as count FROM patrols");
$row = $result->fetch_assoc();
if ($row['count'] == 0) {
    $initial_patrols = [
        ['t1', 'Leão', 'Tarsilla do Amaral'],
        ['t2', 'Pantera', 'Tarsilla do Amaral'],
        ['t3', 'Tigre', 'Tarsilla do Amaral'],
        ['t4', 'Raposa', 'Tarsilla do Amaral'],
        ['z1', 'Morcego', 'Zumbi dos Palmares'],
        ['z2', 'Falcão', 'Zumbi dos Palmares'],
        ['z3', 'Pavão', 'Zumbi dos Palmares'],
        ['z4', 'Águia', 'Zumbi dos Palmares']
    ];
    $stmt = $conn->prepare("INSERT INTO patrols (id, name, troop) VALUES (?, ?, ?)");
    foreach ($initial_patrols as $p) {
        $stmt->bind_param("sss", $p[0], $p[1], $p[2]);
        $stmt->execute();
    }
}

function getAttributeColumn($attribute) {
    if ($attribute === 'Prontidão') return 'xp_prontidao';
    if ($attribute === 'Proficiência') return 'xp_proficiencia';
    if ($attribute === 'Fraternidade') return 'xp_fraternidade';
    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data && isset($data['action']) && $data['action'] === 'delete_logs') {
        $conn->begin_transaction();
        try {
            $logIds = isset($data['logIds']) ? $data['logIds'] : [];
            $groupIds = isset($data['groupIds']) ? $data['groupIds'] : [];
            
            $logsToDelete = [];
            
            if (count($logIds) > 0) {
                $idsStr = "'" . implode("','", array_map([$conn, 'real_escape_string'], $logIds)) . "'";
                $res = $conn->query("SELECT * FROM logs WHERE id IN ($idsStr)");
                while ($row = $res->fetch_assoc()) {
                    $logsToDelete[] = $row;
                }
            }
            
            if (count($groupIds) > 0) {
                $groupsStr = "'" . implode("','", array_map([$conn, 'real_escape_string'], $groupIds)) . "'";
                $res = $conn->query("SELECT * FROM logs WHERE group_id IN ($groupsStr)");
                while ($row = $res->fetch_assoc()) {
                    $exists = false;
                    foreach ($logsToDelete as $l) {
                        if ($l['id'] === $row['id']) {
                            $exists = true;
                            break;
                        }
                    }
                    if (!$exists) {
                        $logsToDelete[] = $row;
                    }
                }
            }
            
            foreach ($logsToDelete as $log) {
                $col = getAttributeColumn($log['attribute']);
                if ($col) {
                    $stmtUpdate = $conn->prepare("UPDATE patrols SET $col = GREATEST(0, $col - ?) WHERE name = ?");
                    $stmtUpdate->bind_param("is", $log['xp_value'], $log['patrol_name']);
                    $stmtUpdate->execute();
                }
                
                $stmtDel = $conn->prepare("DELETE FROM logs WHERE id = ?");
                $stmtDel->bind_param("s", $log['id']);
                $stmtDel->execute();
            }
            
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "Erro ao deletar logs", "details" => $e->getMessage()]);
            exit;
        }
    } elseif ($data && isset($data['logs']) && is_array($data['logs']) && count($data['logs']) > 0) {
        $conn->begin_transaction();
        try {
            $stmtLog = $conn->prepare("INSERT IGNORE INTO logs (id, timestamp, patrol_name, xp_value, attribute, description, comment, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($data['logs'] as $log) {
                $id = $log['id'];
                $timestamp = $log['timestamp'];
                $patrol_name = $log['patrolName'];
                $xp_value = $log['xpValue'];
                $attribute = $log['attribute'];
                $description = $log['description'];
                $comment = isset($log['comment']) ? $log['comment'] : null;
                $group_id = isset($log['groupId']) ? $log['groupId'] : null;

                $stmtLog->bind_param("sdsissss", $id, $timestamp, $patrol_name, $xp_value, $attribute, $description, $comment, $group_id);
                $stmtLog->execute();
                
                if ($stmtLog->affected_rows > 0) {
                    $col = getAttributeColumn($attribute);
                    if ($col) {
                        $stmtUpdate = $conn->prepare("UPDATE patrols SET $col = GREATEST(0, $col + ?) WHERE name = ?");
                        $stmtUpdate->bind_param("is", $xp_value, $patrol_name);
                        $stmtUpdate->execute();
                    }
                }
            }
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "Erro ao processar logs", "details" => $e->getMessage()]);
            exit;
        }
    }
}

$patrols = [];
$resPatrols = $conn->query("SELECT * FROM patrols");
while ($row = $resPatrols->fetch_assoc()) {
    $patrols[] = [
        "id" => $row['id'],
        "name" => $row['name'],
        "troop" => $row['troop'],
        "attributes" => [
            "Prontidão" => ["totalXP" => (int)$row['xp_prontidao']],
            "Proficiência" => ["totalXP" => (int)$row['xp_proficiencia']],
            "Fraternidade" => ["totalXP" => (int)$row['xp_fraternidade']]
        ]
    ];
}

$logs = [];
$resLogs = $conn->query("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100");
while ($row = $resLogs->fetch_assoc()) {
    $log = [
        "id" => $row['id'],
        "timestamp" => (float)$row['timestamp'],
        "patrolName" => $row['patrol_name'],
        "xpValue" => (int)$row['xp_value'],
        "attribute" => $row['attribute'],
        "description" => $row['description']
    ];
    if ($row['comment']) $log['comment'] = $row['comment'];
    if ($row['group_id']) $log['groupId'] = $row['group_id'];
    $logs[] = $log;
}

echo json_encode([
    "status" => "success",
    "patrols" => $patrols,
    "logs" => $logs,
    "lastUpdated" => time() * 1000
]);

$conn->close();
?>`;
  }
};

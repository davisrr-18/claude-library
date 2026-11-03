import { useId, useState } from 'react';
import { useOs } from '../../hooks/useOs.js';
import { OS_LIST, buildInstall } from '../../utils/install.js';
import CodeBlock from '../CodeBlock/CodeBlock.jsx';
import Icon from '../Icon/Icon.jsx';
import Tabs from '../Tabs/Tabs.jsx';
import styles from './InstallPanel.module.css';

const osItems = OS_LIST.map((os) => ({ id: os.id, children: os.label }));

/**
 * Bloco recolhível "Instalar no terminal": abas Linux / macOS / Windows com os comandos que criam os arquivos de
 * `files` ([{ path, content }]) no lugar certo. Os comandos só são montados quando o bloco abre.
 */
export default function InstallPanel({ summary, files }) {
  const [opened, setOpened] = useState(false);
  const [os, chooseOs] = useOs();
  const uid = useId(); // ids próprios: pode haver mais de um bloco na mesma página
  const panelId = `install-code-${uid}`;

  return (
    <details className={styles.install} onToggle={(e) => e.currentTarget.open && setOpened(true)}>
      <summary>
        <Icon name="terminal" size={16} />
        <span>{summary}</span>
      </summary>
      {opened && (
        <div className={styles.body}>
          <p className={styles.hint}>
            Abra o terminal na pasta onde quer instalar (ex.: a sua pasta de estudos), cole e execute. No
            Windows, use o PowerShell.
          </p>
          <Tabs
            label="Sistema operacional"
            prefix={`os-${uid}`}
            panelId={panelId}
            items={osItems}
            value={os}
            onChange={chooseOs}
            className={styles.osTabs}
            tabClassName={styles.osTab}
          />
          <div id={panelId}>
            <CodeBlock
              code={buildInstall(os, files)}
              label="Comandos de instalação"
              copyLabel="Copiar comandos de instalação"
              className={styles.code}
              preClassName={styles.pre}
            />
          </div>
        </div>
      )}
    </details>
  );
}

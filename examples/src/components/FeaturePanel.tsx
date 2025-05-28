import React from 'react';
import './FeaturePanel.css';

interface PlaygroundConfig {
  // Core Features
  showToolbar: boolean;
  toolbarOptions: string[];
  placeholder: string;
  readOnly: boolean;
  
  // Advanced Features
  showLineNumbers: boolean;
  trackChanges: boolean;
  autosave: boolean;
  autosaveInterval: number;
  enableMarkdown: boolean;
  
  // Export Features
  enablePdfExport: boolean;
  enableDocxExport: boolean;
  enableHtmlExport: boolean;
  enableMarkdownExport: boolean;
  
  // Collaboration Features
  currentUser: string;
  enableComments: boolean;
  enableRealTimeSync: boolean;
  
  // Styling
  theme: 'light' | 'dark';
  customCss: string;
}

interface FeaturePanelProps {
  config: PlaygroundConfig;
  onConfigChange: (newConfig: Partial<PlaygroundConfig>) => void;
}

export const FeaturePanel: React.FC<FeaturePanelProps> = ({ config, onConfigChange }) => {
  const handleChange = (key: keyof PlaygroundConfig, value: any) => {
    onConfigChange({ [key]: value });
  };

  return (
    <div className="feature-panel">
      <h3>🎛️ Feature Configuration</h3>
      
      {/* Core Features */}
      <div className="feature-section">
        <h4>📝 Core Features</h4>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.showToolbar}
              onChange={(e) => handleChange('showToolbar', e.target.checked)}
            />
            Show Toolbar
          </label>
        </div>
        
        <div className="feature-item">
          <label>Placeholder Text:</label>
          <input
            type="text"
            value={config.placeholder}
            onChange={(e) => handleChange('placeholder', e.target.value)}
            className="text-input"
          />
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.readOnly}
              onChange={(e) => handleChange('readOnly', e.target.checked)}
            />
            Read Only Mode
          </label>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="feature-section">
        <h4>⚡ Advanced Features</h4>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.showLineNumbers}
              onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
            />
            Line Numbers
          </label>
          <span className="feature-description">Display line numbers in the editor</span>
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.trackChanges}
              onChange={(e) => handleChange('trackChanges', e.target.checked)}
            />
            Track Changes
          </label>
          <span className="feature-description">Enable collaborative change tracking</span>
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.autosave}
              onChange={(e) => handleChange('autosave', e.target.checked)}
            />
            Autosave
          </label>
          <span className="feature-description">Automatically save content</span>
        </div>
        
        {config.autosave && (
          <div className="feature-item sub-item">
            <label>Autosave Interval (ms):</label>
            <input
              type="number"
              value={config.autosaveInterval}
              onChange={(e) => handleChange('autosaveInterval', parseInt(e.target.value))}
              className="number-input"
              min="1000"
              step="1000"
            />
          </div>
        )}
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableMarkdown}
              onChange={(e) => handleChange('enableMarkdown', e.target.checked)}
            />
            Markdown Support
          </label>
          <span className="feature-description">Enable markdown shortcuts and preview</span>
        </div>
      </div>

      {/* Export Features */}
      <div className="feature-section">
        <h4>📤 Export Features</h4>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enablePdfExport}
              onChange={(e) => handleChange('enablePdfExport', e.target.checked)}
            />
            PDF Export
          </label>
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableDocxExport}
              onChange={(e) => handleChange('enableDocxExport', e.target.checked)}
            />
            DOCX Export
          </label>
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableHtmlExport}
              onChange={(e) => handleChange('enableHtmlExport', e.target.checked)}
            />
            HTML Export
          </label>
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableMarkdownExport}
              onChange={(e) => handleChange('enableMarkdownExport', e.target.checked)}
            />
            Markdown Export
          </label>
        </div>
      </div>

      {/* Collaboration Features */}
      <div className="feature-section">
        <h4>👥 Collaboration</h4>
        
        <div className="feature-item">
          <label>Current User:</label>
          <input
            type="text"
            value={config.currentUser}
            onChange={(e) => handleChange('currentUser', e.target.value)}
            className="text-input"
          />
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableComments}
              onChange={(e) => handleChange('enableComments', e.target.checked)}
            />
            Comments (Coming Soon)
          </label>
          <span className="feature-description">Add inline comments and suggestions</span>
        </div>
        
        <div className="feature-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableRealTimeSync}
              onChange={(e) => handleChange('enableRealTimeSync', e.target.checked)}
            />
            Real-time Sync (Coming Soon)
          </label>
          <span className="feature-description">Sync changes across multiple users</span>
        </div>
      </div>

      {/* Styling */}
      <div className="feature-section">
        <h4>🎨 Styling</h4>
        
        <div className="feature-item">
          <label>Theme:</label>
          <select
            value={config.theme}
            onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark')}
            className="select-input"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
}; 
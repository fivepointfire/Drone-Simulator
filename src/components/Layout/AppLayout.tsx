import React, { useState } from 'react';
import './AppLayout.css';

interface AppLayoutProps {
  timelinePanel: React.ReactNode;
  scenePanel: React.ReactNode;
  controlPanel: React.ReactNode;
}

export function AppLayout({ timelinePanel, scenePanel, controlPanel }: AppLayoutProps) {
  const [timelineHeight, setTimelineHeight] = useState(200); // Default timeline height
  const [controlPanelWidth, setControlPanelWidth] = useState(320); // Default control panel width
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false);

  const handleTimelineResize = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = timelineHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(150, Math.min(400, startHeight + deltaY));
      setTimelineHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleControlPanelResize = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = controlPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = Math.max(280, Math.min(500, startWidth + deltaX));
      setControlPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="app-layout">
      {/* Main Content Area */}
      <div className="main-content">
        {/* Scene Panel */}
        <div 
          className="scene-panel"
          style={{
            marginBottom: isTimelineCollapsed ? 0 : timelineHeight,
            marginRight: isControlPanelCollapsed ? 0 : controlPanelWidth,
          }}
        >
          {scenePanel}
        </div>

        {/* Timeline Panel */}
        {!isTimelineCollapsed && (
          <div 
            className="timeline-panel"
            style={{ 
              height: timelineHeight,
              marginRight: isControlPanelCollapsed ? 0 : controlPanelWidth,
            }}
          >
            <div 
              className="timeline-resize-handle"
              onMouseDown={handleTimelineResize}
            >
              <div className="resize-line" />
            </div>
            <div className="timeline-header">
              <h3>Timeline</h3>
              <button 
                className="collapse-btn"
                onClick={() => setIsTimelineCollapsed(true)}
                title="Collapse Timeline"
              >
                ▼
              </button>
            </div>
            <div className="timeline-content">
              {timelinePanel}
            </div>
          </div>
        )}

        {/* Timeline Collapsed State */}
        {isTimelineCollapsed && (
          <div className="timeline-collapsed">
            <button 
              className="expand-timeline-btn"
              onClick={() => setIsTimelineCollapsed(false)}
              title="Expand Timeline"
            >
              ▲ Timeline
            </button>
          </div>
        )}
      </div>

      {/* Control Panel */}
      {!isControlPanelCollapsed && (
        <div 
          className="control-panel"
          style={{ width: controlPanelWidth }}
        >
          <div 
            className="control-panel-resize-handle"
            onMouseDown={handleControlPanelResize}
          >
            <div className="resize-line" />
          </div>
          <div className="control-panel-header">
            <h3>Controls</h3>
            <button 
              className="collapse-btn"
              onClick={() => setIsControlPanelCollapsed(true)}
              title="Collapse Control Panel"
            >
              ▶
            </button>
          </div>
          <div className="control-panel-content">
            {controlPanel}
          </div>
        </div>
      )}

      {/* Control Panel Collapsed State */}
      {isControlPanelCollapsed && (
        <div className="control-panel-collapsed">
          <button 
            className="expand-control-btn"
            onClick={() => setIsControlPanelCollapsed(false)}
            title="Expand Control Panel"
          >
            ◀ Controls
          </button>
        </div>
      )}
    </div>
  );
}

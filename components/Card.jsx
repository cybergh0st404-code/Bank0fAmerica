import React from 'react';

const Card = ({ children, className = '', title, subtitle, headerAction }) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && <h3 className="card-header">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;




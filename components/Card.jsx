import React from 'react';

const Card = ({ children, className = '', title, subtitle, headerAction }) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between gap-2 mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            {title && <h3 className="card-header">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 sm:mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;




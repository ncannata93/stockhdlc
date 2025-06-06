import type React from "react"

interface HistorialProps {
  historial: any[] // Replace 'any' with a more specific type if possible
}

const Historial: React.FC<HistorialProps> = ({ historial }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Historial</h2>
      {historial.length > 0 ? (
        <ul>
          {historial.map((item, index) => (
            <li key={index} className="mb-4">
              <div className="font-medium">{item.fecha}</div>
              <div className="text-sm text-gray-500">{item.descripcion}</div>
              {index < historial.length - 1 && <div className="border-b border-gray-200 my-4" />}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay historial disponible.</p>
      )}
    </div>
  )
}

export default Historial

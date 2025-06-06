import type React from "react"

interface ResumenProps {
  empleados: any[] // Replace 'any' with a more specific type if possible
}

const Resumen: React.FC<ResumenProps> = ({ empleados }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Resumen de Empleados</h2>
      <div className="border-b border-gray-200 my-4" />
      <div className="overflow-y-auto max-h-96">
        {empleados.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Departamento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {empleados.map((empleado) => (
                <tr key={empleado.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{empleado.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{empleado.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{empleado.departamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay empleados para mostrar.</p>
        )}
      </div>
    </div>
  )
}

export default Resumen

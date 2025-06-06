import DatabaseDebug from "./database-debug"

const InicioEmpleados = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Empleados</h1>
      <p>
        Bienvenido al panel de gestión de empleados. Aquí podrás administrar la información de los empleados, agregar
        nuevos empleados y realizar otras tareas relacionadas.
      </p>

      {/* Sección de diagnóstico */}
      <div className="mt-8">
        <DatabaseDebug />
      </div>
    </div>
  )
}

export default InicioEmpleados

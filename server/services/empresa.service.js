// Parámetro de la empresa: umbral de desviación que dispara la alerta (UC5)
import * as empresas from '../repositories/empresas.repository.js'
import * as perfiles from '../repositories/perfiles.repository.js'
import { HttpError } from '../utils/HttpError.js'

export async function ajustarUmbral(db, usuarioId, umbral) {
  const { empresa_id: empresaId } = await perfiles.obtener(db, usuarioId)
  if (!empresaId) throw new HttpError(403, 'Tu usuario no pertenece a una empresa')
  const empresa = await empresas.actualizarUmbral(db, empresaId, umbral)
  return { id: empresa.id, nombre: empresa.nombre, umbralDesviacion: Number(empresa.umbral_desviacion) }
}
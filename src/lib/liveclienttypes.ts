// HACK HACK - this should be a separate type library used by websocket-rooms-server too
// this is just copies of its types
export interface Message {
    type: MESSAGE_TYPE
}
export enum MESSAGE_TYPE {
    HELLO_FAIL_RESP,
    HELLO_SUCCESS_RESP,
    CHANGE_REQ,
    CHANGE_NOTIF,
    ACTION_REQ,
    ACTION_RESP,
    CLOSE_REQ,
    CLOSE_RESP,
}
// hello response
export interface HelloFailResp {
    type: MESSAGE_TYPE.HELLO_FAIL_RESP
    protocol: string
    roomProtocol: string
    msg?: string
}
export interface HelloSuccessResp {
    type: MESSAGE_TYPE.HELLO_SUCCESS_RESP
    protocol: string
    roomProtocol: string
    clientId: string
    clients: ClientMap
    roomState: KVStore
    readonly: boolean
}
// state change request
export interface ChangeReq {
    type: MESSAGE_TYPE.CHANGE_REQ
    roomChanges?: KVSet[]
    clientChanges?: KVSet[]
    echo?: boolean // default false
}
// change notification - asynchronous
export interface ChangeNotif {
    type: MESSAGE_TYPE.CHANGE_NOTIF
    roomChanges?: KVSet[]
    // first
    updateClients?: ClientUpdateMap
    // then
    removeClients?: string[]
    // finally
    addClients?: ClientMap
}
// action response
export interface ActionResp {
    type: MESSAGE_TYPE.ACTION_RESP
    id?: string
    success: boolean
    data?: string
    msg?: string
}
export interface KVStore {
    [key:string] : string
}
export interface ClientInfo {
    clientType?: string
    clientName?: string
    clientState: KVStore
}
export interface ClientMap {
    [id:string] : ClientInfo
}
export interface KVSet {
    key: string
    value?: string
}
export interface ClientUpdateMap {
    [clientid:string] : KVSet[]
}

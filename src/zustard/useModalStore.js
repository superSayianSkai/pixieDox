import { create } from 'zustand';

const useModalStore = create((set, get) => ({
  modal: {
    type: "",
    state: false,
  },
  openModal: (type) =>
    set({ modal: { type, state: true } }),

  closeModal: () =>
    set({ modal: { type: "", state: false } }),

  toggleModal: (type) => {
    const { modal } = get();
    if (modal.type === type && modal.state) {
      set({ modal: { type: "", state: false } });
    } else {
      set({ modal: { type, state: true } });
    }
  },
}));



export default useModalStore;

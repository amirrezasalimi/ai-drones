
interface Data {
    generation: number,
    best: any,
    scores: {
        [key: string]: {
            color: string
            scores: number[]
        }
    }
}
const loadData = (): Data => {
    const data = localStorage.getItem('_data');
    return data ? JSON.parse(data) : null;
}

const saveData = (oldData: Data, data: Partial<Data>) => {
    localStorage.setItem('_data', JSON.stringify({
        ...oldData,
        ...data
    }));
}

const removeData = () => {
    localStorage.removeItem("_data");
}

class DataManager {
    data: Data | null = null;

    constructor() {
        this.data = loadData();
    }

    loadData() {
        this.data = loadData();
        return this.data;
    }

    saveData(data: Partial<Data>) {
        const old = loadData();
        saveData(old, data);
        this.data = loadData();
    }

    removeData() {
        removeData();
    }
}


const dataManager = new DataManager();
export default dataManager